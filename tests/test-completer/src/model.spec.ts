// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { expect } from 'chai';

import { CodeEditor } from '@jupyterlab/codeeditor';

import {
  CompleterModel,
  Completer,
  CompletionHandler
} from '@jupyterlab/completer';

function makeState(text: string): Completer.ITextState {
  return {
    column: 0,
    lineHeight: 0,
    charWidth: 0,
    line: 0,
    coords: { left: 0, right: 0, top: 0, bottom: 0 } as CodeEditor.ICoordinate,
    text
  };
}

describe('completer/model', () => {
  describe('CompleterModel', () => {
    describe('#constructor()', () => {
      it('should create a completer model', () => {
        let model = new CompleterModel();
        expect(model).to.be.an.instanceof(CompleterModel);
      });
    });

    describe('#stateChanged', () => {
      it('should signal when model items have changed', () => {
        let model = new CompleterModel();
        let called = 0;
        let listener = (sender: any, args: void) => {
          called++;
        };
        model.stateChanged.connect(listener);
        expect(called).to.equal(0);
        model.setItems({ isIncomplete: false, items: [{ label: 'foo' }] });
        expect(called).to.equal(1);
        model.setItems({ isIncomplete: false, items: [{ label: 'foo' }] });
        model.setItems({
          isIncomplete: false,
          items: [{ label: 'foo' }, { label: 'bar' }]
        });
        expect(called).to.equal(2);
      });

      it('should not signal when items have not changed', () => {
        let model = new CompleterModel();
        let called = 0;
        let listener = (sender: any, args: void) => {
          called++;
        };
        model.stateChanged.connect(listener);
        expect(called).to.equal(0);
        model.setItems({ isIncomplete: false, items: [{ label: 'foo' }] });
        model.setItems({ isIncomplete: false, items: [{ label: 'foo' }] });
        expect(called).to.equal(1);
        model.setItems({
          isIncomplete: false,
          items: [{ label: 'foo' }, { label: 'bar' }]
        });
        model.setItems({
          isIncomplete: false,
          items: [{ label: 'foo' }, { label: 'bar' }]
        });
        expect(called).to.equal(2);
        model.setItems({ isIncomplete: false, items: [] });
        model.setItems({ isIncomplete: false, items: [] });
        model.setItems({ isIncomplete: false, items: [] });
        expect(called).to.equal(3);
      });

      it('should signal when original request changes', () => {
        let model = new CompleterModel();
        let called = 0;
        let listener = (sender: any, args: void) => {
          called++;
        };
        model.stateChanged.connect(listener);
        expect(called).to.equal(0);
        model.original = makeState('foo');
        expect(called).to.equal(1);
        model.original = null;
        expect(called).to.equal(2);
      });

      it('should not signal when original request has not changed', () => {
        let model = new CompleterModel();
        let called = 0;
        let listener = (sender: any, args: void) => {
          called++;
        };
        model.stateChanged.connect(listener);
        expect(called).to.equal(0);
        model.original = makeState('foo');
        model.original = makeState('foo');
        expect(called).to.equal(1);
        model.original = null;
        model.original = null;
        expect(called).to.equal(2);
      });

      it('should signal when current text changes', () => {
        let model = new CompleterModel();
        let called = 0;
        let currentValue = 'foo';
        let newValue = 'foob';
        let cursor: Completer.ICursorSpan = { start: 0, end: 0 };
        let request = makeState(currentValue);
        let change = makeState(newValue);
        let listener = (sender: any, args: void) => {
          called++;
        };
        model.stateChanged.connect(listener);
        expect(called).to.equal(0);
        model.original = request;
        expect(called).to.equal(1);
        model.cursor = cursor;
        model.current = change;
        expect(called).to.equal(2);
        model.current = null;
        expect(called).to.equal(3);
      });

      it('should not signal when current text is unchanged', () => {
        let model = new CompleterModel();
        let called = 0;
        let currentValue = 'foo';
        let newValue = 'foob';
        let cursor: Completer.ICursorSpan = { start: 0, end: 0 };
        let request = makeState(currentValue);
        let change = makeState(newValue);
        let listener = (sender: any, args: void) => {
          called++;
        };
        model.stateChanged.connect(listener);
        expect(called).to.equal(0);
        model.original = request;
        expect(called).to.equal(1);
        model.cursor = cursor;
        model.current = change;
        model.current = change;
        expect(called).to.equal(2);
        model.current = null;
        model.current = null;
        expect(called).to.equal(3);
      });
    });

    describe('#items()', () => {
      it('should return an unfiltered list of items if query is blank', () => {
        let model = new CompleterModel();
        let want: CompletionHandler.ICompletionItem[] = [
          { label: 'foo' },
          { label: 'bar' },
          { label: 'baz' }
        ];
        model.setItems({
          isIncomplete: false,
          items: [{ label: 'foo' }, { label: 'bar' }, { label: 'baz' }]
        });
        expect(model.items().items).to.deep.equal(want);
      });
      it('should return a filtered list of items if query is set', () => {
        let model = new CompleterModel();
        let want: CompletionHandler.ICompletionItem = {
          label: '<mark>f</mark>oo',
          insertText: 'foo'
        };
        model.setItems({
          isIncomplete: false,
          items: [
            { label: 'foo', insertText: 'foo' },
            { label: 'bar', insertText: 'bar' },
            { label: 'baz', insertText: 'baz' }
          ]
        });
        model.query = 'f';
        const items = model.items().items;
        expect(items.length).equal(1);
        expect(items[0]).to.include({
          label: want.label,
          insertText: want.insertText
        });
      });
      it('should order list based on score', () => {
        let model = new CompleterModel();
        let want: CompletionHandler.ICompletionItem[] = [
          { insertText: 'qux', label: '<mark>qux</mark>' },
          { insertText: 'quux', label: '<mark>qu</mark>u<mark>x</mark>' }
        ];
        model.setItems({
          isIncomplete: false,
          items: [
            { label: 'foo', insertText: 'foo' },
            { label: 'bar', insertText: 'bar' },
            { label: 'baz', insertText: 'baz' },
            { label: 'quux', insertText: 'quux' },
            { label: 'qux', insertText: 'qux' }
          ]
        });
        model.isLegacy = true;
        model.query = 'qux';
        const items = model.items().items;
        expect(items.length).to.equal(want.length);
        for (let index = 0; index < items.length; index++) {
          const item = items[index];
          expect(item).to.include({
            label: want[index].label,
            insertText: want[index].insertText
          });
        }
      });
      it('should break ties in score by locale sort', () => {
        let model = new CompleterModel();
        let want: CompletionHandler.ICompletionItem[] = [
          { insertText: 'quux', label: '<mark>qu</mark>ux' },
          { insertText: 'qux', label: '<mark>qu</mark>x' }
        ];
        model.setItems({
          isIncomplete: false,
          items: [
            { label: 'foo', insertText: 'foo' },
            { label: 'bar', insertText: 'bar' },
            { label: 'baz', insertText: 'baz' },
            { label: 'quux', insertText: 'quux' },
            { label: 'qux', insertText: 'qux' }
          ]
        });
        model.query = 'qu';
        const items = model.items().items;
        expect(items.length).to.equal(want.length);
        for (let index = 0; index < items.length; index++) {
          const item = items[index];
          expect(item).to.include({
            label: want[index].label,
            insertText: want[index].insertText
          });
        }
      });
    });

    describe('#original', () => {
      it('should default to null', () => {
        let model = new CompleterModel();
        expect(model.original).to.be.null;
      });

      it('should return the original request', () => {
        let model = new CompleterModel();
        let request = makeState('foo');
        model.original = request;
        expect(model.original).to.equal(request);
      });
    });

    describe('#current', () => {
      it('should default to null', () => {
        let model = new CompleterModel();
        expect(model.current).to.be.null;
      });

      it('should initially equal the original request', () => {
        let model = new CompleterModel();
        let request = makeState('foo');
        model.original = request;
        expect(model.current).to.equal(request);
      });

      it('should not set if original request is nonexistent', () => {
        let model = new CompleterModel();
        let currentValue = 'foo';
        let newValue = 'foob';
        let cursor: Completer.ICursorSpan = { start: 0, end: 0 };
        let request = makeState(currentValue);
        let change = makeState(newValue);
        model.current = change;
        expect(model.current).to.be.null;
        model.original = request;
        model.cursor = cursor;
        model.current = change;
        expect(model.current).to.equal(change);
      });

      it('should not set if cursor is nonexistent', () => {
        let model = new CompleterModel();
        let currentValue = 'foo';
        let newValue = 'foob';
        let request = makeState(currentValue);
        let change = makeState(newValue);
        model.original = request;
        model.cursor = null;
        model.current = change;
        expect(model.current).to.not.equal(change);
      });

      it('should reset model if change is shorter than original', () => {
        let model = new CompleterModel();
        let currentValue = 'foo';
        let newValue = 'fo';
        let cursor: Completer.ICursorSpan = { start: 0, end: 0 };
        let request = makeState(currentValue);
        let change = makeState(newValue);
        model.original = request;
        model.cursor = cursor;
        model.current = change;
        expect(model.current).to.be.null;
        expect(model.original).to.be.null;
        expect(model.items()).to.deep.equal({ isIncomplete: false, items: [] });
      });
    });

    describe('#cursor', () => {
      it('should default to null', () => {
        let model = new CompleterModel();
        expect(model.cursor).to.be.null;
      });

      it('should not set if original request is nonexistent', () => {
        let model = new CompleterModel();
        let cursor: Completer.ICursorSpan = { start: 0, end: 0 };
        let request = makeState('foo');
        model.cursor = cursor;
        expect(model.cursor).to.be.null;
        model.original = request;
        model.cursor = cursor;
        expect(model.cursor).to.equal(cursor);
      });
    });

    describe('#isDisposed', () => {
      it('should be true if model has been disposed', () => {
        let model = new CompleterModel();
        expect(model.isDisposed).to.equal(false);
        model.dispose();
        expect(model.isDisposed).to.equal(true);
      });
    });

    describe('#dispose()', () => {
      it('should dispose of the model resources', () => {
        let model = new CompleterModel();
        model.setItems({ isIncomplete: false, items: [{ label: 'foo' }] });
        expect(model.isDisposed).to.equal(false);
        model.dispose();
        expect(model.isDisposed).to.equal(true);
      });

      it('should be safe to call multiple times', () => {
        let model = new CompleterModel();
        expect(model.isDisposed).to.equal(false);
        model.dispose();
        model.dispose();
        expect(model.isDisposed).to.equal(true);
      });
    });

    describe('#handleTextChange()', () => {
      it('should set current change value', () => {
        let model = new CompleterModel();
        let currentValue = 'foo';
        let newValue = 'foob';
        let cursor: Completer.ICursorSpan = { start: 0, end: 0 };
        let request = makeState(currentValue);
        let change = makeState(newValue);
        (change as any).column = 4;
        model.original = request;
        model.cursor = cursor;
        expect(model.current).to.equal(request);
        model.handleTextChange(change);
        expect(model.current).to.equal(change);
      });

      it('should reset if last char is whitespace && column < original', () => {
        let model = new CompleterModel();
        let currentValue = 'foo';
        let newValue = 'foo ';
        let request = makeState(currentValue);
        (request as any).column = 3;
        let change = makeState(newValue);
        (change as any).column = 0;
        model.original = request;
        expect(model.original).to.equal(request);
        model.handleTextChange(change);
        expect(model.original).to.be.null;
      });
    });

    describe('#createPatch()', () => {
      it('should return a patch value', () => {
        let model = new CompleterModel();
        let patch = 'foobar';
        let want: Completer.IPatch = {
          start: 0,
          end: 3,
          value: patch
        };
        let cursor: Completer.ICursorSpan = { start: 0, end: 3 };
        model.original = makeState('foo');
        model.cursor = cursor;
        expect(model.createPatch(patch)).to.deep.equal(want);
      });

      it('should return undefined if original request or cursor are null', () => {
        let model = new CompleterModel();
        expect(model.createPatch('foo')).to.be.undefined;
      });

      it('should handle line breaks in original value', () => {
        let model = new CompleterModel();
        let currentValue = 'foo\nbar';
        let patch = 'barbaz';
        let start = currentValue.length;
        let end = currentValue.length;
        let want: Completer.IPatch = {
          start,
          end,
          value: patch
        };
        let cursor: Completer.ICursorSpan = { start, end };
        model.original = makeState(currentValue);
        model.cursor = cursor;
        expect(model.createPatch(patch)).to.deep.equal(want);
      });
    });
  });
});
