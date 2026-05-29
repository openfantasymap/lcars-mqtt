import { Component, inject, Input } from "@angular/core";
import { ConnectorService } from "./connector.service";
import { IssueService } from "./issue.service";

export interface ViewComponentInterface {
}

export interface CommandComponentInterface {

}


/**
 * Base class for interactive ("command") widgets. Carries the `emit` topic and
 * a single publish path: `emitValue` pushes the control's value to
 * `{room}/io/{emit}` AND reports it to IssueService so auto-resolved issues can
 * see the player's console state.
 */
@Component({
    template: ''
})
export class BaseEmitter implements CommandComponentInterface {
    @Input() emit: string | null = null;

    protected connector = inject(ConnectorService);
    protected issues = inject(IssueService);

    /** Publish this control's value and feed it to auto-resolution. */
    protected emitValue(value: any) {
        if (!this.emit) {
            return;
        }
        this.connector.publishIo(this.emit, value);
        this.issues.reportLocalState(this.emit, value);
    }
}
