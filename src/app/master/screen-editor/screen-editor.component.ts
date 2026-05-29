import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScreenService } from '../../screen.service';

interface PaletteEntry {
  type: string;
  hint: string;
}

/**
 * GM editor for station screens. The GM picks/creates a screen id and edits its
 * layout as JSON (mix-and-matching the component palette below); saving
 * publishes the retained {room}/screens registry, which stations load by id.
 */
@Component({
  selector: 'lcars-screen-editor',
  imports: [CommonModule, FormsModule],
  templateUrl: './screen-editor.component.html',
  styleUrls: ['./screen-editor.component.scss']
})
export class ScreenEditorComponent implements OnInit {

  selectedId = '';
  json = '';
  error = '';
  newId = '';

  /** Reference of placeable component types for mixing and matching. */
  palette: PaletteEntry[] = [
    { type: 'row', hint: '{ "type":"row", "content":[ ... ] }' },
    { type: 'column', hint: '{ "type":"column", "content":[ ... ] }' },
    { type: 'panel', hint: '{ "type":"panel", "title":"...", "note":"..." }' },
    { type: 'button', hint: '{ "type":"button", "label":"...", "emit":"topic", "value":1 }' },
    { type: 'toggle', hint: '{ "type":"toggle", "label":"...", "emit":"topic" }' },
    { type: 'nav', hint: '{ "type":"nav", "emit":"topic" }' },
    { type: 'stats', hint: '{ "type":"stats", "editable":true, "ship":"id?" }' },
    { type: 'issues', hint: '{ "type":"issues" }' }
  ];

  constructor(public screens: ScreenService) { }

  ngOnInit(): void {
    this.screens.screensChange.subscribe(() => {
      // Keep the open editor in sync if the selected screen vanished.
      if (this.selectedId && !this.screens.get(this.selectedId)) {
        this.selectedId = '';
        this.json = '';
      }
    });
  }

  select(id: string) {
    this.selectedId = id;
    this.error = '';
    this.json = JSON.stringify(this.screens.get(id) || {}, null, 2);
  }

  create() {
    const id = this.newId.trim();
    if (!id) {
      return;
    }
    this.selectedId = id;
    this.newId = '';
    this.error = '';
    this.json = JSON.stringify(this.starter(id), null, 2);
  }

  save() {
    if (!this.selectedId) {
      this.error = 'Pick or create a screen first.';
      return;
    }
    let parsed: any;
    try {
      parsed = JSON.parse(this.json);
    } catch (e: any) {
      this.error = 'Invalid JSON: ' + (e && e.message ? e.message : e);
      return;
    }
    this.error = '';
    this.screens.saveScreen(this.selectedId, parsed);
  }

  remove() {
    if (this.selectedId) {
      this.screens.deleteScreen(this.selectedId);
      this.selectedId = '';
      this.json = '';
    }
  }

  private starter(id: string): any {
    return {
      title: id.toUpperCase(),
      footer: 'NCC-1701-G',
      structure: {
        sidebar: [
          { type: 'button', height: 1, target: { type: 'tab', tab: 'main', label: 'Main' } }
        ],
        content: {
          main: {
            type: 'column',
            content: [
              { type: 'panel', title: id },
              { type: 'issues' }
            ]
          }
        }
      },
      sources: []
    };
  }
}
