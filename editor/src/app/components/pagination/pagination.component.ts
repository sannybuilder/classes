import { Component, EventEmitter, Input, Output } from '@angular/core';
import { chunk } from 'lodash';

@Component({
  selector: 'scl-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
})
export class PaginationComponent {
  readonly pageSize = 100;
  private _pages: number[];

  @Input() set total(length: number) {
    this._pages = chunk({ length }, this.pageSize).map((_, i) => i + 1);
  }

  @Input() currentPage = 1;
  @Output() pageChange: EventEmitter<number> = new EventEmitter();

  get pages() {
    return this._pages;
  }

  selectPage(index: number) {
    this.pageChange.emit(index);
    return false;
  }
}
