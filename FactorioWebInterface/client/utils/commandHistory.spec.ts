import { CommandHistory } from "./commandHistory";
import { strict } from "assert";

describe('CommandHistory', function () {
    it('when empty moveNext returns undefined.', function () {
        let ch = new CommandHistory();

        strict.equal(ch.moveNext(), undefined);
        strict.equal(ch.moveNext(), undefined);
    });

    it('when empty movePrev returns undefined.', function () {
        let ch = new CommandHistory();

        strict.equal(ch.movePrev(), undefined);
        strict.equal(ch.movePrev(), undefined);
    });

    it('movePrev cycles commands.', function () {
        let ch = new CommandHistory();
        ch.write('1');
        ch.write('2');
        ch.write('3');

        strict.equal(ch.movePrev(), '3');
        strict.equal(ch.movePrev(), '2');
        strict.equal(ch.movePrev(), '1');
        strict.equal(ch.movePrev(), '3');
    });

    it('moveNext cycles commands.', function () {
        let ch = new CommandHistory();
        ch.write('1');
        ch.write('2');
        ch.write('3');

        strict.equal(ch.moveNext(), '1');
        strict.equal(ch.moveNext(), '2');
        strict.equal(ch.moveNext(), '3');
        strict.equal(ch.moveNext(), '1');
    });

    it('resetIndex resets index.', function () {
        let ch = new CommandHistory();
        ch.write('1');
        ch.write('2');
        ch.write('3');

        strict.equal(ch.moveNext(), '1');

        ch.resetIndex();
        strict.equal(ch.moveNext(), '1');
    });

    it('write resets index.', function () {
        let ch = new CommandHistory();
        ch.write('1');
        ch.write('2');
        ch.write('3');

        strict.equal(ch.moveNext(), '1');

        ch.write('4');
        strict.equal(ch.moveNext(), '1');
    });

    it('using command from history moves command to last used.', function () {
        // Arrange.
        let ch = new CommandHistory();
        ch.write('1');
        ch.write('2');
        ch.write('3');

        ch.movePrev();
        let last = ch.movePrev();
        strict.equal(last, '2');

        // Act.
        ch.write(last);

        // Assert.
        strict.equal(ch.movePrev(), '2');
        strict.equal(ch.movePrev(), '3');
        strict.equal(ch.movePrev(), '1');
    });

    it('using last command keeps history the same.', function () {
        // Arrange.
        let ch = new CommandHistory();
        ch.write('1');
        ch.write('2');
        ch.write('3');

        let last = ch.movePrev();
        strict.equal(last, '3');

        // Act.
        ch.write(last);

        // Assert.
        strict.equal(ch.movePrev(), '3');
        strict.equal(ch.movePrev(), '2');
        strict.equal(ch.movePrev(), '1');
    });

    it('writting a new command that is same as last keeps history the same.', function () {
        // Arrange.
        let ch = new CommandHistory();
        ch.write('1');
        ch.write('2');
        ch.write('3');

        // Act.
        ch.write('3');

        // Assert.
        strict.equal(ch.movePrev(), '3');
        strict.equal(ch.movePrev(), '2');
        strict.equal(ch.movePrev(), '1');
    });
});