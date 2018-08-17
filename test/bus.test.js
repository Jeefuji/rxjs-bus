import './common.test'
import uuid from "uuid/v4";
import _ from "lodash";
import { BusManager } from '../dist/rxjs-bus';

describe('BusManager', () => {
    beforeEach(() => {
        BusManager.configure({
            bus: [{ name: "test" }]
        });
    });

    afterEach(() => {
        BusManager.clear();
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

    it('can modify event scheduler management', () => {
        const bus = BusManager.get("test");
        const eventId = uuid();

        bus.on(eventId, (event) => expect(event.data).to.be.equal(eventId), {
            scheduler: BusManager.scheduler.asap
        });

        bus.emit(eventId, eventId)
    })

    it('can add and remove bus', () => {
        const busId = uuid();

        BusManager.add(busId);
        expect(BusManager.get(busId)).to.be.not.undefined;

        BusManager.remove(busId);
        expect(BusManager.get(busId)).to.be.undefined;
    });
});