import {ElementRef, Signal} from "@angular/core";

export interface ISize {
    width: number;
    height: number;
}

export abstract class LayoutProvider {
    abstract readonly boardSize: Signal<ISize>;
    abstract readonly playerSize: Signal<ISize>;
    abstract readonly objectSize: Signal<number>;

    abstract setBoardSize(ref: ElementRef): void;
    abstract setPlayerSize(ref: ElementRef): void;
}
