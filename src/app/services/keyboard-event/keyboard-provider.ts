import { Observable } from 'rxjs';

export abstract class KeyboardProvider {
    abstract onPressedKeys(keys: string[]): Observable<string | null>;
}
