
"use strict";
import { Subject, Scheduler } from "rxjs";
import { filter, tap, pluck, take, observeOn, subscribeOn } from "rxjs/operators";

import _ from "lodash";
import uuid from "uuid/v4";

// Private definitions
function Bus(name, options) {
    var self = this;
    options = options || {};

    this.name = name;
    this.withLogs = options.withLogs === undefined ? true : options.withLogs;
    this.withStringify = options.withStringify === undefined ? true : options.withStringify;

    this.subject = new Subject();

    function log(m) {
        if (self.withLogs) {
            console.debug("[rxjs-bus][Bus]" + m);
        }
    }

    function error(m) {
        console.error("[rxjs-bus][Bus]" + m);
    }

    function formatData(d) {
        if (self.withStringify) { return JSON.stringify(d); }
        return d;
    }

    function on(eventName) {
        return self.subject
            .pipe(
                filter((o) => { return o.name === eventName; }),
                tap((o) => { log("[On] => Event " + o.name + " received (" + formatData(o.data) + ")"); }, error),
                pluck("data")
            );
    };

    function once(eventName) {
        return self.subject
            .pipe(
                filter((o) => { return o.name === eventName; }),
                take(1),
                tap((o) => { log("[Once] => Event " + o.name + " received (" + formatData(o.data) + ")"); }, error),
                pluck("data")
            )
    };

    function applyOptions(event, options) {
        if (options.builder) {
            event = options.builder(event);
        }

        if (options.scheduler) {
            event = s.pipe(
                observeOn(options.scheduler),
                subscribeOn(options.scheduler)
            );
        }

        return event;
    }

    return {
        raw: function (eventName) {
            log("[Raw] @ Raw subscribing to " + eventName);
            return on(eventName);
        },
        on: function (eventName, callback, options) {
            options = options || {};

            if (!callback) {
                error("Event callback is undefined.");
                return null;
            }

            log("[On] @ Subscribing to " + eventName);

            var s = on(eventName);

            s = applyOptions(s, options);

            return s.subscribe(callback);
        },
        once: function (eventName, callback, options) {
            options = options || {};

            if (!callback) {
                error("Event callback is undefined.");
                return null;
            }

            log("[Once] @ Subscribing to " + eventName);

            var s = once(eventName);

            s = applyOptions(s, options);

            return s.subscribe(callback);
        },
        emit: function (eventName, data, options) {
            log("[Emit] <= Emitting " + eventName + " (" + formatData(data) + ")");

            var emittedObject = {
                data: data
            };

            if(options) {
                if(options.ack && options.ack.callback) {
                    var id = options.ack.name || uuid();
                    var s = once(id);

                    options.ack.options = options.ack.options || {
                        scheduler: Scheduler.asap
                    };

                    if(options.ack.options) {
                        s = applyOptions(s, options.ack.options);
                    }

                    log(`[Emit] Requiring ack with id ${id}`)

                    s.subscribe(options.ack.callback);

                    // fill info for receiver methods
                    emittedObject.ack = {
                        name: id,
                        callback: (data) => {
                            self.subject.next({
                                name: id,
                                data: {
                                    data: data
                                }
                            });
                        }
                    }
                }
            }

            // Emit
            self.subject.next({
                name: eventName,
                data: emittedObject
            });
        }
    };
}

function BusManager() {
    var vm = this;
    vm.bus = {};

    // Public instance
    var instance = {
        configure: function(busList) {
            _.each(busList.bus, function (c) {
                if (c) {
                    instance.add(c.name, c.options);
                }
            });
        },
        add: function (name, options) {
            if (_.has(vm.bus, name)) { return; }
            vm.bus[name] = new Bus(name, options);
        },
        get: function (name) {
            name = name || "global"; // default bus
            return vm.bus[name];
        },
        remove: function (name) {
            var o = vm.bus[name];
            if (o) {
                if (o.dispose) {
                    o.dispose();
                }
                delete vm.bus[name];
            }
        },
        clear: function () {
            for (var o in vm.bus) {
                if (o && o.dispose) {
                    o.dispose();
                }
            }
        }
    };

    return instance;
}

function SmokeBus() {
    return {
        createSmokeBus: function (emitFn, onFn) {
            return {
                emit: emitFn,
                on: onFn
            };
        }
    }
}

export default new BusManager();
export {
    SmokeBus,
    Bus
};
