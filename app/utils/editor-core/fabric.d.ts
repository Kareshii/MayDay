
import { fabric } from 'fabric';

declare module 'fabric' {
  namespace fabric {
    class GuideLine extends Line {
      constructor(points: any, options?: any);
      axis: string;
      activeOn: string;
      initialize(points?: any, options?: any): any;
      isHorizontal(): boolean;
    }
    export let fontPaths: any;
    interface IGuideLineOptions extends ILineOptions {
      axis?: 'horizontal' | 'vertical';
    }
    interface Canvas {
      _setupCurrentTransform(e: Event, target: Object, alreadySelected: boolean): void;
      restorePointerVpt(pointer: { x: number; y: number }): { y: number; x: number };
    }
    interface Object {
      evented?: boolean;
      id?: string;
      gradientAngle?: number;
      linkData?: any;
      editable?: boolean;
      extensionType?: string;
      extension?: any;
      verticalAlign?: string;
      roundValue?: boolean;
      path?: any;
    }
  }
}
