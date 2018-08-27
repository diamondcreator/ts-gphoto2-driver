import {checkCode, GPhoto2Driver, GPPointerFloat} from "../driver";
import {PointerCameraWidget} from "../driver/modules";

export class WidgetRange {
  /**
   * The minimum accepted value.
   */
  public min: number;
  /**
   * The maximum accepted value.
   */
  public max: number;
  /**
   * The stepping.
   */
  public step: number;

  constructor(widget: PointerCameraWidget) {
    const min = GPPointerFloat();
    const max = GPPointerFloat();
    const step = GPPointerFloat();
    checkCode(GPhoto2Driver.gp_widget_get_range(widget, min, max, step), "gp_widget_get_range");
    this.min = min.deref();
    this.max = max.deref();
    this.step = step.deref();
  }

  public toJSON() {
    return {
      min: this.min,
      max: this.max,
      step: this.step
    };
  }

  public toString() {
    return "Range{" + this.min + ".." + this.max + ", step=" + this.step + "}";
  }
}
