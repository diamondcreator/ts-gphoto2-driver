import {classOf, nameOf} from "@tsed/core";
import {$log} from "@tsed/logger";
import {Closeable, closeQuietly, getGPhoto2Driver, GPCodes, GPhoto2Driver, PointerOf} from "@tsed/gphoto2-core";
import {alloc, Type} from "ref-napi";
import {addInstance, removeInstance} from "./Garbage";
import {Context} from "./Context";

export interface PointerWrapperOptions {
  method: string;
  refType: Type;
  loadWithContext?: boolean;
  openMethod?: string;
  closeMethod?: string;
}

export class PointerWrapper<P extends PointerOf<any>> implements Closeable {
  constructor(private options: PointerWrapperOptions, ...args: any[]) {
    this.new(...args);
  }

  private _buffer: PointerOf<P>;

  get buffer(): PointerOf<P> {
    return this._buffer;
  }

  get size(): number {
    return this.call<number>("count");
  }

  get byRef(): PointerOf<P> {
    return this._buffer;
  }

  get pointer(): P {
    return this._buffer.deref();
  }

  load(): this {
    $log.debug(`Load ${nameOf(classOf(this))}...`);

    this.call("load", ...[this.options.loadWithContext && Context.get().pointer].filter(Boolean));

    this.$afterLoaded();

    $log.debug(`Load ${nameOf(classOf(this))}... ok`);
    return this;
  }

  async loadAsync(): Promise<this> {
    $log.debug(`Load ${nameOf(classOf(this))}...`);

    await this.callAsync("load", ...[this.options.loadWithContext && Context.get().pointer].filter(Boolean));
    await this.$afterLoaded();

    $log.debug(`Load ${nameOf(classOf(this))}... ok`);

    return this;
  }

  close(): this {
    const {closeMethod} = this.getOptions();

    this.call(closeMethod);
    removeInstance(this);

    return this;
  }

  closeQuietly() {
    closeQuietly(this);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected $afterLoaded(): any {}

  protected callByRef(key: string, ...args: any[]) {
    let {method} = this.getOptions();
    method = `${method}_${key.replace(method, "")}`;

    return this.run(method, this.byRef, ...args);
  }

  protected call<T = any>(key: string, ...args: any[]) {
    let {method} = this.getOptions();
    method = `${method}_${key.replace(method, "")}`;

    return this.run<T>(method, this.pointer, ...args);
  }

  protected run<T = any>(key: keyof GPhoto2Driver | string, ...args: any[]): T {
    const driver = getGPhoto2Driver();

    return driver.run(key as any, ...args);
  }

  protected async callAsync<T>(key: string, ...args: any[]) {
    let {method} = this.getOptions();
    method = `${method}_${key.replace(method, "")}`;

    return this.runAsync<T>(method as any, this.pointer, ...args);
  }

  protected async runAsync<T = any>(key: keyof GPhoto2Driver | string, ...args: any[]): Promise<T> {
    const driver = getGPhoto2Driver();

    return driver.runAsync(key as any, ...args);
  }

  protected new(...args: any[]): GPCodes {
    const {openMethod, refType} = this.getOptions();

    addInstance(this);
    this._buffer = alloc(refType) as any;

    return this.callByRef(openMethod, ...args);
  }

  private getOptions() {
    const {method, refType, openMethod = "new", closeMethod = "free"} = this.options;

    return {
      method,
      refType,
      openMethod,
      closeMethod
    };
  }
}
