/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {Directive, ElementRef, Optional, Injectable} from '@angular/core';
import {
  BaseDirective2,
  StyleBuilder,
  StyleDefinition,
  StyleUtils,
  MediaMarshaller,
  ElementMatcher,
} from '@angular/flex-layout/core';
import {takeUntil} from 'rxjs/operators';

import {LAYOUT_VALUES, isFlowHorizontal} from '../utils/layout-validator';
import {extendObject} from '../../utils/object-extend';

export interface LayoutAlignParent {
  layout: string;
}

@Injectable({providedIn: 'root'})
export class LayoutAlignStyleBuilder extends StyleBuilder {
  buildStyles(align: string, parent: LayoutAlignParent) {
    const css: StyleDefinition = {}, [mainAxis, crossAxis] = align.split(' ');

    // Main axis
    switch (mainAxis) {
      case 'center':
        css['justify-content'] = 'center';
        break;
      case 'space-around':
        css['justify-content'] = 'space-around';
        break;
      case 'space-between':
        css['justify-content'] = 'space-between';
        break;
      case 'space-evenly':
        css['justify-content'] = 'space-evenly';
        break;
      case 'end':
      case 'flex-end':
        css['justify-content'] = 'flex-end';
        break;
      case 'start':
      case 'flex-start':
      default :
        css['justify-content'] = 'flex-start';  // default main axis
        break;
    }

    // Cross-axis
    switch (crossAxis) {
      case 'start':
      case 'flex-start':
        css['align-items'] = css['align-content'] = 'flex-start';
        break;
      case 'center':
        css['align-items'] = css['align-content'] = 'center';
        break;
      case 'end':
      case 'flex-end':
        css['align-items'] = css['align-content'] = 'flex-end';
        break;
      case 'space-between':
        css['align-content'] = 'space-between';
        css['align-items'] = 'stretch';
        break;
      case 'space-around':
        css['align-content'] = 'space-around';
        css['align-items'] = 'stretch';
        break;
      case 'baseline':
        css['align-content'] = 'stretch';
        css['align-items'] = 'baseline';
        break;
      case 'stretch':
      default : // 'stretch'
        css['align-items'] = css['align-content'] = 'stretch';   // default cross axis
        break;
    }

    return extendObject(css, {
      'display' : 'flex',
      'flex-direction' : parent.layout,
      'box-sizing' : 'border-box',
      'max-width': crossAxis === 'stretch' ?
        !isFlowHorizontal(parent.layout) ? '100%' : null : null,
      'max-height': crossAxis === 'stretch' ?
        isFlowHorizontal(parent.layout) ? '100%' : null : null,
    }) as StyleDefinition;
  }
}

const inputs = [
  'fxLayoutAlign', 'fxLayoutAlign.xs', 'fxLayoutAlign.sm', 'fxLayoutAlign.md',
  'fxLayoutAlign.lg', 'fxLayoutAlign.xl', 'fxLayoutAlign.lt-sm', 'fxLayoutAlign.lt-md',
  'fxLayoutAlign.lt-lg', 'fxLayoutAlign.lt-xl', 'fxLayoutAlign.gt-xs', 'fxLayoutAlign.gt-sm',
  'fxLayoutAlign.gt-md', 'fxLayoutAlign.gt-lg'
];
const selector = `
  [fxLayoutAlign], [fxLayoutAlign.xs], [fxLayoutAlign.sm], [fxLayoutAlign.md],
  [fxLayoutAlign.lg], [fxLayoutAlign.xl], [fxLayoutAlign.lt-sm], [fxLayoutAlign.lt-md],
  [fxLayoutAlign.lt-lg], [fxLayoutAlign.lt-xl], [fxLayoutAlign.gt-xs], [fxLayoutAlign.gt-sm],
  [fxLayoutAlign.gt-md], [fxLayoutAlign.gt-lg]
`;

/**
 * 'layout-align' flexbox styling directive
 *  Defines positioning of child elements along main and cross axis in a layout container
 *  Optional values: {main-axis} values or {main-axis cross-axis} value pairs
 *
 *  @see https://css-tricks.com/almanac/properties/j/justify-content/
 *  @see https://css-tricks.com/almanac/properties/a/align-items/
 *  @see https://css-tricks.com/almanac/properties/a/align-content/
 */
export class LayoutAlignDirective extends BaseDirective2 {
  protected DIRECTIVE_KEY = 'layout-align';
  protected layout = 'row';  // default flex-direction

  constructor(protected elRef: ElementRef,
              protected styleUtils: StyleUtils,
              // NOTE: not actually optional, but we need to force DI without a
              // constructor call
              @Optional() protected styleBuilder: LayoutAlignStyleBuilder,
              protected marshal: MediaMarshaller) {
    super(elRef, styleBuilder, styleUtils, marshal);
    this.init();
    this.marshal.trackValue(this.nativeElement, 'layout')
      .pipe(takeUntil(this.destroySubject))
      .subscribe(this.onLayoutChange.bind(this));
  }

  // *********************************************
  // Protected methods
  // *********************************************

  /**
   *
   */
  protected updateWithValue(value: string) {
    const layout = this.layout || 'row';
    if (layout === 'row') {
      this.styleCache = layoutAlignHorizontalCache;
    } else if (layout === 'row-reverse') {
      this.styleCache = layoutAlignHorizontalRevCache;
    } else if (layout === 'column') {
      this.styleCache = layoutAlignVerticalCache;
    } else if (layout === 'column-reverse') {
      this.styleCache = layoutAlignVerticalRevCache;
    }
    this.addStyles(value, {layout});
  }

  /**
   * Cache the parent container 'flex-direction' and update the 'flex' styles
   */
  protected onLayoutChange(matcher: ElementMatcher) {
    const layout: string = matcher.value;
    this.layout = layout.split(' ')[0];
    if (!LAYOUT_VALUES.find(x => x === this.layout)) {
      this.layout = 'row';
    }
    this.triggerUpdate();
  }
}

@Directive({selector, inputs})
export class DefaultLayoutAlignDirective extends LayoutAlignDirective {
  protected inputs = inputs;
}

const layoutAlignHorizontalCache: Map<string, StyleDefinition> = new Map();
const layoutAlignVerticalCache: Map<string, StyleDefinition> = new Map();
const layoutAlignHorizontalRevCache: Map<string, StyleDefinition> = new Map();
const layoutAlignVerticalRevCache: Map<string, StyleDefinition> = new Map();
