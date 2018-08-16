import './common.test'
import uuid from "uuid/v4";
import _ from "lodash";
import { BusManager } from '../dist/rxjs-bus';

describe('BusManager', () => {
    beforeEach(() => {

    });

    afterEach(() => {

    });

    it('can configure BusManager', () => {
        const bus = [
            { name: uuid(), options: { withLogs: true } },
            { name: uuid(), options: { withLogs: false } }
        ];

        BusManager.configure({
            bus
        });
    
        _.each(bus, (b) => {
            expect(BusManager.get(b.name)).to.be.not.null;
        })
    });
});