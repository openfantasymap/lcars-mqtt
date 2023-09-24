import { Component, Input } from "@angular/core";

export interface ViewComponentInterface {
}

export interface CommandComponentInterface{
    
}


@Component({
    template: ''
})
export class BaseEmitter implements CommandComponentInterface{
    @Input() emit: string|null = null;
}