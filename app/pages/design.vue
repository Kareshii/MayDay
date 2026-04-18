<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */

definePageMeta({
  layout: 'full-width',
})

type DesignAsset = {
  id: number
  src: string
  alt: string
}

let fabricLib: any = null
let threeLib: any = null
let OrbitControlsCtor: any = null
let createId: (() => string) | null = null
let EditorClass: any = null
let editorPlugins: any[] = []
let dependenciesLoaded = false

// --- State ---
const canvasRef = ref<HTMLCanvasElement | null>(null)
const threeContainerRef = ref<HTMLDivElement | null>(null)
const workspaceEl = ref<HTMLDivElement | null>(null)

// Editor Instance
let canvas: any = null
let editor: any = null

// UI State
const currentTool = ref<'select' | 'draw'>('select')
const activeObject = ref<any>(null)
const canUndo = ref(false)
const canRedo = ref(false)
const initError = ref<string | null>(null)

// Drawing Props
const brushColor = ref('#000000')
const brushSize = ref(5)

// 3D State
let scene: any
let camera: any
let renderer: any
let controls: any
let currentModel: any = null
let animationId: number
let canvasTexture: any = null

const models = [
  { label: 'OEM高度键帽', value: 'keycap' },
  { label: '冰箱贴', value: 'magnet' },
  { label: '平面贴纸', value: 'sticker' },
  { label: '亚克力板', value: 'acrylic' },
  { label: '帆布袋', value: 'totebag' },
]
const selectedModel = ref('keycap')

// Assets
const assets = ref<DesignAsset[]>([
  { id: 1, src: 'https://placehold.co/100x100/FF5733/white?text=A', alt: 'Asset A' },
  { id: 2, src: 'https://placehold.co/100x100/33FF57/white?text=B', alt: 'Asset B' },
  { id: 3, src: 'https://placehold.co/100x100/3357FF/white?text=C', alt: 'Asset C' },
  { id: 4, src: 'https://placehold.co/100x100/F3FF33/black?text=D', alt: 'Asset D' },
])

async function loadDesignDependencies() {
  if (dependenciesLoaded) {
    return
  }

  const [
    { fabric },
    threeModule,
    { OrbitControls },
    { v4 },
    { default: Editor },
    { default: DringPlugin },
    { default: AlignGuidLinePlugin },
    { default: ControlsPlugin },
    { default: ControlsRotatePlugin },
    { default: CenterAlignPlugin },
    { default: LayerPlugin },
    { default: CopyPlugin },
    { default: MoveHotKeyPlugin },
    { default: DeleteHotKeyPlugin },
    { default: GroupPlugin },
    { default: DrawLinePlugin },
    { default: GroupTextEditorPlugin },
    { default: GroupAlignPlugin },
    { default: WorkspacePlugin },
    { default: HistoryPlugin },
    { default: FlipPlugin },
    { default: RulerPlugin },
    { default: MaterialPlugin },
    { default: FontPlugin },
    { default: FreeDrawPlugin },
  ] = await Promise.all([
    import('fabric'),
    import('three'),
    import('three/examples/jsm/controls/OrbitControls.js'),
    import('uuid'),
    import('../utils/editor-core'),
    import('../utils/editor-core/plugin/DringPlugin'),
    import('../utils/editor-core/plugin/AlignGuidLinePlugin'),
    import('../utils/editor-core/plugin/ControlsPlugin'),
    import('../utils/editor-core/plugin/ControlsRotatePlugin'),
    import('../utils/editor-core/plugin/CenterAlignPlugin'),
    import('../utils/editor-core/plugin/LayerPlugin'),
    import('../utils/editor-core/plugin/CopyPlugin'),
    import('../utils/editor-core/plugin/MoveHotKeyPlugin'),
    import('../utils/editor-core/plugin/DeleteHotKeyPlugin'),
    import('../utils/editor-core/plugin/GroupPlugin'),
    import('../utils/editor-core/plugin/DrawLinePlugin'),
    import('../utils/editor-core/plugin/GroupTextEditorPlugin'),
    import('../utils/editor-core/plugin/GroupAlignPlugin'),
    import('../utils/editor-core/plugin/WorkspacePlugin'),
    import('../utils/editor-core/plugin/HistoryPlugin'),
    import('../utils/editor-core/plugin/FlipPlugin'),
    import('../utils/editor-core/plugin/RulerPlugin'),
    import('../utils/editor-core/plugin/MaterialPlugin'),
    import('../utils/editor-core/plugin/FontPlugin'),
    import('../utils/editor-core/plugin/FreeDrawPlugin'),
  ])

  fabricLib = fabric
  threeLib = threeModule
  OrbitControlsCtor = OrbitControls
  createId = v4
  EditorClass = Editor
  editorPlugins = [
    DringPlugin,
    AlignGuidLinePlugin,
    ControlsPlugin,
    ControlsRotatePlugin,
    CenterAlignPlugin,
    LayerPlugin,
    CopyPlugin,
    MoveHotKeyPlugin,
    DeleteHotKeyPlugin,
    GroupPlugin,
    DrawLinePlugin,
    GroupTextEditorPlugin,
    GroupAlignPlugin,
    WorkspacePlugin,
    HistoryPlugin,
    FlipPlugin,
    RulerPlugin,
    MaterialPlugin,
    FontPlugin,
    FreeDrawPlugin,
  ]
  dependenciesLoaded = true
}

function generateId() {
  if (createId) {
    return createId()
  }

  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `asset-${Date.now()}`
}

// --- Computed Properties for Right Panel ---
const objectColor = computed({
    get: () => {
        if (!activeObject.value) return '#000000'
        return (activeObject.value.fill as string || '#000000')
    },
    set: (val) => {
        if (!activeObject.value) return
        activeObject.value.set('fill', val)
        canvas?.requestRenderAll()
        update3D()
        saveHistory()
    }
})

const objectOpacity = computed({
    get: () => {
         if (!activeObject.value) return 100
         return Math.round((activeObject.value.opacity || 1) * 100)
    },
    set: (val) => {
        if (!activeObject.value) return
        activeObject.value.set('opacity', val / 100)
        canvas?.requestRenderAll()
        update3D()
        saveHistory()
    }
})

// --- Lifecycle ---
onMounted(async () => {
  try {
    await loadDesignDependencies()
    await initEditor()
    await initThree()
    window.addEventListener('resize', onWindowResize)
    setTimeout(update3D, 100)
  } catch (error) {
    console.error('Failed to initialize design page', error)
    initError.value = '创意工坊初始化失败，请刷新后重试'
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', onWindowResize)
  }
  if (animationId) cancelAnimationFrame(animationId)
  if (renderer) renderer.dispose()
  if (editor) {
    editor.destory()
  }
})

// --- Editor Logic ---
async function initEditor() {
  if (!canvasRef.value || !workspaceEl.value || !fabricLib || !EditorClass) return
  
  canvas = new fabricLib.Canvas(canvasRef.value, {
    preserveObjectStacking: true,
  })
  
  editor = new EditorClass()
  editor.init(canvas)
  
  editorPlugins.forEach((plugin) => {
    editor.use(plugin)
  })
    
  await nextTick()

  // Event Listeners
  canvas.on('selection:created', updateActiveObject)
  canvas.on('selection:updated', updateActiveObject)
  canvas.on('selection:cleared', () => activeObject.value = null)
  
  canvas.on('object:modified', () => {
      update3D()
      // HistoryPlugin handles saveState on object:modified internally usually, 
      // but let's check. Yes, it does.
  })
  canvas.on('object:added', update3D)
  canvas.on('object:removed', update3D)
  canvas.on('path:created', update3D)
  // Removed after:render to improve performance
  
  // History Events
  editor.on('historyUpdate', (undo: number, redo: number) => {
      canUndo.value = undo > 0
      canRedo.value = redo > 0
  })

  // Initial update
  editor.getPlugin('HistoryPlugin')?.historyUpdate?.()
}

function updateActiveObject() {
    if (!canvas) return
    const actives = canvas.getActiveObjects()
    if (actives.length === 1) {
        activeObject.value = actives[0]
    } else {
        // Handle multi-selection if needed, for now treat as null or special group
        activeObject.value = null
    }
}

function saveHistory() {
    // Manually trigger save if we modified properties programmatically without firing events
    // Assuming HistoryPlugin exposes a way or hooks into object:modified
    // If we set props via code, we should fire 'object:modified' or activeObject.dirty = true
    canvas?.fire('object:modified')
}

// --- Actions ---

// Tools
function setTool(tool: 'select' | 'draw') {
    currentTool.value = tool
    if (canvas) {
        canvas.isDrawingMode = (tool === 'draw')
        if (tool === 'draw') {
             if (canvas.freeDrawingBrush) {
                canvas.freeDrawingBrush.color = brushColor.value
                canvas.freeDrawingBrush.width = brushSize.value
            }
        }
    }
}

// Add Objects
function addText() {
    setTool('select')
    if (!canvas || !fabricLib) return
    const text = new fabricLib.IText('输入文字', {
        left: 100,
        top: 100,
        fill: '#000000',
        fontSize: 40,
        fontFamily: 'Arial',
        id: generateId()
    })
    canvas.add(text)
    canvas.setActiveObject(text)
}

function addRect() {
    setTool('select')
    if (!canvas || !fabricLib) return
    const rect = new fabricLib.Rect({
        left: 100,
        top: 100,
        fill: '#FF5733',
        width: 100,
        height: 100,
        id: generateId()
    })
    canvas.add(rect)
    canvas.setActiveObject(rect)
}

function addCircle() {
    setTool('select')
    if (!canvas || !fabricLib) return
    const circle = new fabricLib.Circle({
        left: 150,
        top: 100,
        fill: '#33FF57',
        radius: 50,
        id: generateId()
    })
    canvas.add(circle)
    canvas.setActiveObject(circle)
}

function addTriangle() {
    setTool('select')
    if (!canvas || !fabricLib) return
    const triangle = new fabricLib.Triangle({
        left: 100,
        top: 100,
        fill: '#3357FF',
        width: 100,
        height: 100,
        id: generateId()
    })
    canvas.add(triangle)
    canvas.setActiveObject(triangle)
}

function clearCanvas() {
    if (!editor || !canvas) return
    editor.clear() 
    canvas.setBackgroundColor('#ffffff', () => {
        canvas?.renderAll()
        update3D()
    })
}

// History
function undo() {
    (editor?.getPlugin('HistoryPlugin') as any)?.undo()
}
function redo() {
    (editor?.getPlugin('HistoryPlugin') as any)?.redo()
}

// Group
function group() {
    const plugin = editor?.getPlugin('GroupPlugin') as any
    if (plugin) plugin.group()
}
function ungroup() {
    const plugin = editor?.getPlugin('GroupPlugin') as any
    if (plugin) plugin.unGroup()
}

// Layer
function layerUp() { (editor?.getPlugin('LayerPlugin') as any)?.up() }
function layerDown() { (editor?.getPlugin('LayerPlugin') as any)?.down() }
function layerToFront() { (editor?.getPlugin('LayerPlugin') as any)?.toFront() }
function layerToBack() { (editor?.getPlugin('LayerPlugin') as any)?.toBack() }

// Align
function align(type: string) {
    const plugin = editor?.getPlugin('GroupAlignPlugin') as any
    if (plugin) {
        switch(type) {
            case 'left': plugin.left(); break;
            case 'center': plugin.xcenter(); break;
            case 'right': plugin.right(); break;
            case 'top': plugin.top(); break;
            case 'middle': plugin.ycenter(); break;
            case 'bottom': plugin.bottom(); break;
        }
    }
}

// Flip
function flip(type: 'X' | 'Y') {
    (editor?.getPlugin('FlipPlugin') as any)?.flip(type)
}

// Tool Watchers
watch(brushColor, (color) => {
   if (!canvas || !canvas.freeDrawingBrush) return
   canvas.freeDrawingBrush.color = color
})

watch(brushSize, (size) => {
   if (!canvas || !canvas.freeDrawingBrush) return
   canvas.freeDrawingBrush.width = size
})


// --- 3D Logic (Unchanged mostly) ---
function update3D() {
    updateTexture()
}
async function initThree() {
  if (!threeContainerRef.value || !canvas || !threeLib || !OrbitControlsCtor) return
  const width = threeContainerRef.value.clientWidth
  const height = threeContainerRef.value.clientHeight
  scene = new threeLib.Scene()
  scene.background = new threeLib.Color(0x1a1a1a)
  camera = new threeLib.PerspectiveCamera(50, width / height, 0.1, 1000)
  camera.position.z = 3
  renderer = new threeLib.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(width, height)
  renderer.shadowMap.enabled = true
  threeContainerRef.value.appendChild(renderer.domElement)
  
  const canvasEl = canvas.getElement()
  canvasTexture = new threeLib.CanvasTexture(canvasEl)
  canvasTexture.colorSpace = threeLib.SRGBColorSpace
  canvasTexture.minFilter = threeLib.LinearFilter
  
  const ambientLight = new threeLib.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const dirLight = new threeLib.DirectionalLight(0xffffff, 0.8)
  dirLight.position.set(2, 5, 5)
  dirLight.castShadow = true
  scene.add(dirLight)
  
  controls = new OrbitControlsCtor(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  
  createModel(selectedModel.value)
  animate()
}
function createModel(type: string) {
  if (!scene || !threeLib) {
    return
  }

  if (currentModel) {
    scene.remove(currentModel)
    currentModel.traverse((child: any) => {
       if (child instanceof threeLib.Mesh) {
         if (child.geometry) child.geometry.dispose()
       }
    })
  }
  const material = new threeLib.MeshStandardMaterial({ 
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.1,
    map: canvasTexture
  })
  const group = new threeLib.Group()
  if (type === 'keycap') {
    const geometry = new threeLib.CylinderGeometry(0.5, 0.7, 0.6, 4)
    geometry.rotateY(Math.PI / 4) 
    const mesh = new threeLib.Mesh(geometry, material)
    group.add(mesh)
  } else if (type === 'magnet') {
    const geometry = new threeLib.BoxGeometry(1.2, 1.2, 0.1)
    const mesh = new threeLib.Mesh(geometry, material)
    group.add(mesh)
  } else if (type === 'sticker') {
    const geometry = new threeLib.PlaneGeometry(1.2, 1.2)
    material.side = threeLib.DoubleSide
    const mesh = new threeLib.Mesh(geometry, material)
    group.add(mesh)
  } else if (type === 'acrylic') {
    const geometry = new threeLib.BoxGeometry(1, 1.4, 0.05)
    const mesh = new threeLib.Mesh(geometry, material)
    group.add(mesh)
  } else if (type === 'totebag') {
    const bagGeo = new threeLib.BoxGeometry(1.2, 1.4, 0.4)
    const bagMesh = new threeLib.Mesh(bagGeo, material)
    const handleGeo = new threeLib.TorusGeometry(0.3, 0.05, 16, 50, Math.PI)
    const handleMat = new threeLib.MeshStandardMaterial({ color: 0xd2b48c }) 
    const handle1 = new threeLib.Mesh(handleGeo, handleMat)
    handle1.position.set(0, 0.7, 0)
    group.add(bagMesh)
    group.add(handle1)
  }
  currentModel = group
  scene.add(currentModel)
  if (canvasTexture) canvasTexture.needsUpdate = true
}
function updateTexture() {
  if (!canvasTexture) return
  canvasTexture.needsUpdate = true
}
function changeModel() {
  createModel(selectedModel.value)
}
function animate() {
  animationId = requestAnimationFrame(animate)
  if (controls) controls.update()
  renderer.render(scene, camera)
}
function onWindowResize() {
  if (!threeContainerRef.value || !camera || !renderer) return
  const w = threeContainerRef.value.clientWidth
  const h = threeContainerRef.value.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

function saveJson() {
  editor?.saveJson?.()
}

function triggerUpload() {
  document.getElementById('uploadInput')?.click()
}

function handleUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])

  files.forEach((file, index) => {
    assets.value.push({
      id: Date.now() + index,
      src: URL.createObjectURL(file),
      alt: file.name,
    })
  })

  input.value = ''
}

// --- Drag Drop ---
function onDragStart(e: DragEvent, src: string) {
  if (e.dataTransfer) {
    e.dataTransfer.setData('imageSrc', src)
    e.dataTransfer.effectAllowed = 'copy'
  }
}
function onDrop(e: DragEvent) {
  const src = e.dataTransfer?.getData('imageSrc')
  if (!src || !canvas || !fabricLib) return
  const pointer = canvas.getPointer(e)
  fabricLib.Image.fromURL(src, (img: any) => {
      if (!img) return
      img.set({
          left: pointer.x,
          top: pointer.y,
          originX: 'center',
          originY: 'center',
          id: generateId()
      })
      canvas?.add(img)
      canvas?.setActiveObject(img)
      update3D()
  }, { crossOrigin: 'anonymous' })
  setTool('select')
}
</script>

<template>
  <div class="h-screen w-full flex flex-col bg-gray-50 text-gray-900 font-sans overflow-hidden">
    
    <!-- Top Toolbar -->
    <header class="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between shrink-0 z-20 shadow-sm">
        <div class="flex items-center gap-4">
            <h1 class="text-lg font-bold text-indigo-600 flex items-center gap-2">
                <span>🎨</span> 创意工坊
            </h1>
            <div class="h-6 w-px bg-gray-300 mx-2"></div>
            
            <!-- History -->
            <div class="flex gap-1">
                <div class="group relative">
                    <button @click="undo" :disabled="!canUndo" class="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent">
                        <Icon name="lucide:undo-2" class="w-5 h-5" />
                    </button>
                    <span class="absolute left-1/2 top-[calc(100%+0.25rem)] -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">撤销</span>
                </div>
                <div class="group relative">
                    <button @click="redo" :disabled="!canRedo" class="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent">
                        <Icon name="lucide:redo-2" class="w-5 h-5" />
                    </button>
                    <span class="absolute left-1/2 top-[calc(100%+0.25rem)] -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">重做</span>
                </div>
            </div>
            
            <div class="h-6 w-px bg-gray-300 mx-2"></div>
            
            <!-- Grouping -->
            <div class="flex gap-1">
                <div class="group relative">
                    <button @click="group" class="p-2 rounded hover:bg-gray-100">
                        <Icon name="lucide:group" class="w-5 h-5" />
                    </button>
                    <span class="absolute left-1/2 top-[calc(100%+0.25rem)] -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">组合</span>
                </div>
                <div class="group relative">
                    <button @click="ungroup" class="p-2 rounded hover:bg-gray-100">
                        <Icon name="lucide:ungroup" class="w-5 h-5" />
                    </button>
                    <span class="absolute left-1/2 top-[calc(100%+0.25rem)] -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">拆分</span>
                </div>
            </div>
            
            <div class="h-6 w-px bg-gray-300 mx-2"></div>

            <!-- Layer -->
             <div class="flex gap-1">
                <button @click="layerToFront" class="p-2 rounded hover:bg-gray-100" title="置顶">
                    <Icon name="lucide:bring-to-front" class="w-5 h-5" />
                </button>
                <button @click="layerUp" class="p-2 rounded hover:bg-gray-100" title="上移一层">
                     <Icon name="lucide:arrow-up-from-line" class="w-5 h-5" />
                </button>
                <button @click="layerDown" class="p-2 rounded hover:bg-gray-100" title="下移一层">
                     <Icon name="lucide:arrow-down-from-line" class="w-5 h-5" />
                </button>
                <button @click="layerToBack" class="p-2 rounded hover:bg-gray-100" title="置底">
                    <Icon name="lucide:send-to-back" class="w-5 h-5" />
                </button>
            </div>

            <div class="h-6 w-px bg-gray-300 mx-2"></div>

             <!-- Align -->
             <div class="flex gap-1">
                <button @click="align('left')" class="p-2 rounded hover:bg-gray-100" title="左对齐"><Icon name="lucide:align-left" class="w-5 h-5" /></button>
                <button @click="align('center')" class="p-2 rounded hover:bg-gray-100" title="水平居中"><Icon name="lucide:align-center" class="w-5 h-5" /></button>
                <button @click="align('right')" class="p-2 rounded hover:bg-gray-100" title="右对齐"><Icon name="lucide:align-right" class="w-5 h-5" /></button>
                <button @click="align('top')" class="p-2 rounded hover:bg-gray-100" title="顶对齐"><Icon name="lucide:align-vertical-justify-start" class="w-5 h-5" /></button>
                <button @click="align('middle')" class="p-2 rounded hover:bg-gray-100" title="垂直居中"><Icon name="lucide:align-vertical-center" class="w-5 h-5" /></button>
                <button @click="align('bottom')" class="p-2 rounded hover:bg-gray-100" title="底对齐"><Icon name="lucide:align-vertical-justify-end" class="w-5 h-5" /></button>
            </div>

        </div>
        
        
        <div class="flex gap-2">
             <button @click="saveJson" class="text-sm text-indigo-600 hover:text-indigo-800 px-3 py-1 border border-indigo-200 rounded hover:bg-indigo-50 flex items-center gap-1">
                <Icon name="lucide:save" class="w-4 h-4" /> 保存
             </button>
             <button @click="clearCanvas" class="text-sm text-red-500 hover:text-red-700 px-3 py-1 border border-red-200 rounded hover:bg-red-50">清空</button>
        </div>
    </header>

    <div class="flex-1 flex overflow-hidden">
        <!-- Left Sidebar Tools -->
        <aside class="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-4 z-10">
            <button 
                @click="setTool('select')"
                :class="{'bg-indigo-100 text-indigo-600': currentTool === 'select', 'text-gray-500 hover:bg-gray-100': currentTool !== 'select'}"
                class="w-10 h-10 rounded-lg flex items-center justify-center transition-colors" title="选择"
            >
                <Icon name="lucide:mouse-pointer-2" class="w-5 h-5" />
            </button>
            
             <button 
                @click="setTool('draw')"
                :class="{'bg-indigo-100 text-indigo-600': currentTool === 'draw', 'text-gray-500 hover:bg-gray-100': currentTool !== 'draw'}"
                class="w-10 h-10 rounded-lg flex items-center justify-center transition-colors" title="画笔"
            >
                <Icon name="lucide:pencil" class="w-5 h-5" />
            </button>

             <button @click="addText" class="w-10 h-10 text-gray-500 hover:bg-gray-100 rounded-lg flex items-center justify-center" title="添加文字">
                <Icon name="lucide:type" class="w-5 h-5" />
            </button>
            
            <div class="w-8 h-px bg-gray-200"></div>
            
            <button @click="addRect" class="w-10 h-10 text-gray-500 hover:bg-gray-100 rounded-lg flex items-center justify-center" title="矩形">
                <Icon name="lucide:square" class="w-5 h-5" />
            </button>
            <button @click="addCircle" class="w-10 h-10 text-gray-500 hover:bg-gray-100 rounded-lg flex items-center justify-center" title="圆形">
                <Icon name="lucide:circle" class="w-5 h-5" />
            </button>
            <button @click="addTriangle" class="w-10 h-10 text-gray-500 hover:bg-gray-100 rounded-lg flex items-center justify-center" title="三角形">
                <Icon name="lucide:triangle" class="w-5 h-5" />
            </button>
        </aside>

        <!-- Secondary Left Panel (Contextual or Assets) -->
        <aside class="w-64 bg-white border-r border-gray-200 flex flex-col z-10">
            <div class="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 class="font-semibold text-gray-700">素材库</h2>
                <button @click="triggerUpload" class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded flex items-center gap-1">
                    <Icon name="lucide:upload" class="w-3 h-3" /> 上传
                </button>
                <input id="uploadInput" type="file" accept="image/*" class="hidden" @change="handleUpload" />
            </div>
            <div class="p-4 overflow-y-auto flex-1">
                <div class="grid grid-cols-2 gap-3">
                     <div 
                        v-for="asset in assets" 
                        :key="asset.id"
                        draggable="true"
                        @dragstart="onDragStart($event, asset.src)"
                        class="aspect-square bg-gray-50 rounded-lg border border-gray-200 overflow-hidden cursor-move hover:ring-2 hover:ring-indigo-400"
                    >
                         <img :src="asset.src" class="w-full h-full object-contain pointer-events-none p-2" />
                    </div>
                </div>
            </div>
        </aside>

        <!-- Main Canvas Area -->
        <main 
            class="flex-1 bg-gray-100 relative overflow-hidden flex items-center justify-center"
            ref="workspaceEl"
             @dragover.prevent
             @drop.prevent="onDrop"
        >
             <div class="absolute inset-0 pattern-grid opacity-10 pointer-events-none"></div>
              <div class="relative shadow-2xl">
                 <canvas ref="canvasRef" width="600" height="600"></canvas>
              </div>
        </main>

        <!-- Right Property Panel -->
        <aside class="w-[320px] bg-white border-l border-gray-200 flex flex-col z-10 shrink-0">
            <!-- Property / 3D Tabs could go here, for now stacked -->
            
            <!-- Properties -->
            <div class="flex-1 overflow-y-auto border-b border-gray-200">
                <div class="p-4 border-b border-gray-100">
                    <h2 class="font-semibold text-gray-700">属性</h2>
                </div>
                
                <div v-if="activeObject" class="p-4 space-y-6">
                    <!-- Color -->
                    <div v-if="activeObject.type !== 'image'">
                        <label class="text-xs font-semibold text-gray-500 uppercase mb-2 block">填充颜色</label>
                        <div class="flex gap-2 items-center">
                            <input type="color" v-model="objectColor" class="w-8 h-8 p-0 border-0 rounded overflow-hidden cursor-pointer" />
                            <span class="text-sm font-mono text-gray-600">{{ objectColor }}</span>
                        </div>
                    </div>

                    <!-- Opacity -->
                    <div>
                         <label class="text-xs font-semibold text-gray-500 uppercase mb-2 block">不透明度 {{ objectOpacity }}%</label>
                         <input type="range" v-model.number="objectOpacity" min="0" max="100" class="w-full" />
                    </div>

                    <!-- Layout -->
                    <div>
                         <label class="text-xs font-semibold text-gray-500 uppercase mb-2 block">变换</label>
                         <div class="grid grid-cols-2 gap-2">
                             <button @click="flip('X')" class="py-1 px-2 border rounded text-xs hover:bg-gray-50">水平翻转</button>
                             <button @click="flip('Y')" class="py-1 px-2 border rounded text-xs hover:bg-gray-50">垂直翻转</button>
                         </div>
                    </div>

                </div>
                
                <!-- Drawing Settings (when drawing tool active) -->
                <div v-else-if="currentTool === 'draw'" class="p-4 space-y-6">
                    <div>
                        <label class="text-xs font-semibold text-gray-500 uppercase mb-2 block">画笔颜色</label>
                        <div class="flex gap-2 flex-wrap">
                            <button 
                                v-for="c in ['#000000', '#EF4444', '#22C55E', '#3B82F6', '#F59E0B']"
                                :key="c"
                                @click="brushColor = c"
                                class="w-8 h-8 rounded-full border border-gray-200"
                                :class="{'ring-2 ring-offset-1 ring-gray-400': brushColor === c}"
                                :style="{backgroundColor: c}"
                            ></button>
                        </div>
                    </div>
                     <div>
                         <label class="text-xs font-semibold text-gray-500 uppercase mb-2 block">画笔大小 {{ brushSize }}px</label>
                         <input type="range" v-model.number="brushSize" min="1" max="50" class="w-full" />
                    </div>
                </div>

                <div v-else class="p-8 text-center text-gray-400 text-sm">
                    未选择对象
                </div>
            </div>

            <!-- 3D Preview (Mini) -->
            <div class="h-[300px] bg-gray-900 flex flex-col">
                 <div class="p-2 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
                    <span class="text-xs text-white font-medium">3D 预览</span>
                     <select v-model="selectedModel" @change="changeModel" class="bg-gray-700 text-white text-xs rounded px-2 py-1 border-none outline-none">
                        <option v-for="m in models" :key="m.value" :value="m.value">{{ m.label }}</option>
                     </select>
                </div>
                 <div ref="threeContainerRef" class="flex-1 w-full bg-black"></div>
            </div>
        </aside>
    </div>
  </div>
</template>

<style scoped>
.pattern-grid {
  background-image: radial-gradient(#9ca3af 1px, transparent 1px);
  background-size: 20px 20px;
}
</style>
