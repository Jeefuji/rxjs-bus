
"use strict";

import _ from "lodash";
import { BehaviorSubject } from "rxjs";
import { skipWhile, tap, observeOn, subscribeOn, take } from "rxjs/operators";

function State(name, initialState, options) {
    var self = this;
    this.name = name;
    this.initialState = "..$**INITIALSTATE**$..";
    if (initialState === undefined) {
        initialState = this.initialState;
    }

    this.subject = new BehaviorSubject(initialState);
    this.withLogs = options.withLogs === undefined ? true : options.withLogs;
    this.withStringify = options.withStringify === undefined ? true : options.withStringify;
    this.errorHandler = console.error;

    function log(m) {
        if (self.withLogs) { console.debug(m,  ["Event", "State"]); }
    }

    function formatData(d) {
        if (self.withStringify) { return JSON.stringify(d); }
        return d;
    }

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
        raw: function () {
            log("[Raw] @ Raw subscribing to " + self.name);
            return self.subject
            .pipe(
                skipWhile((o) => o === self.initialState),
                tap((o) => { log("[Raw] => Event " + self.name + " received (" + formatData(o) + ")"); }, self.errorHandler)
            );
        },
        on: function (callback, options) {
            options = options || {};
            if (!callback) {
                console.error("Event callback is undefined.");
                return null;
            }

            log("[On] @ Subscribing to " + self.name);

            var s = self.subject
                .pipe(
                    skipWhile((o) => o === self.initialState),
                    tap((o) => { log("[On] => Event " + self.name + " received (" + formatData(o) + ")"); }, self.errorHandler)
                );

            s = applyOptions(s, options);

            return s.subscribe(callback);
        },
        once: function (callback, options) {
            options = options || {};
            if (!callback) {
                console.error("Event callback is undefined.");
                return null;
            }

            log("[Once] @ Subscribing to " + self.name);

            var s = self.subject
            .pipe(
                skipWhile((o) => o === self.initialState),
                tap((o) => { log("[Once] => Event " + self.name + " received (" + formatData(o) + ")"); }, self.errorHandler),
                take(1) // initial and new state
            );

            s = applyOptions(s, options);

            return s.subscribe(callback);
        },
        update: function (data) {
            if (self.isCompleted) {
                logger.warn("The event " + self.name + " is actually closed, updating it is impossible.");
                return;
            }

            // Emit
            log("[Update] <= Updating " + self.name + " (" + data + ")");
            self.subject.next(data);
        },
        close: function () {
            self.subject.complete();
        }
    };
}


function StateRepository(name, options) {
    var self = this;
    this.name = name;
    this.subjects = {};
    this.withLogs = options.withLogs === undefined ? true : options.withLogs;
    this.errorHandler = logger.error;

    return {
        register: function (eventName, initialState) {
            if (!_.has(self.subjects, eventName)) {
                self.subjects[eventName] = new State(eventName, initialState, self.withLogs);
                return true;
            }
            return false;
        },
        unregister: function (eventName) {
            if (_.has(self.subjects, eventName)) {
                _.remove(self.subjects, function(o) {
                    return o === eventName;
                });
                return true;
            }
            return false;
        },
        raw: function (eventName) {
            if (!_.has(self.subjects, eventName)) {
                this.register(eventName);
            }

            return self.subjects[eventName].raw();
        },
        on: function (eventName, callback, options) {
            if (!callback) {
                console.error("Event callback is undefined.");
                return null;
            }

            if (!_.has(self.subjects, eventName)) {
                this.register(eventName);
            }

            return self.subjects[eventName]
                .on(callback, options);
        },
        once: function (eventName, callback, options) {
            var unregister = this.unregister;
            if (!callback) {
                console.error("Event callback is undefined.");
                return null;
            }

            if (!_.has(self.subjects, eventName)) {
                this.register(eventName);
            }

            return self.subjects[eventName]
                .once(function(o) {
                    callback();
                    if (o != null) {unregister(eventName);}
                }, options);
        },
        update: function (eventName, data) {
            if (self.isCompleted) {
                logger.warn("The event " + self.name + " is actually closed, updating it is impossible.");
                return;
            }

            if (!_.has(self.subjects, eventName)) {
                this.register(eventName, data);
            }

            // Emit
            self.subjects[eventName].update(data);
        }
    };
}

function RepositoryManager() {
    var vm = this;
    vm.repositories = {};

    // Public instance
    var instance = {
        configure: function (repositories) {
            _.each(repositories, function(c) {
                if (c) {
                    instance.add(c.name, c.options);
                }
            });
        },
        add: function (name, options) {
            if (_.has(vm.repositories, name)) { return; }
            vm.repositories[name] = new StateRepository(name, options);
        },
        get: function (name) {
            name = name || "global"; // default state repository
            return vm.repositories[name];
        },
        remove: function (name) {
            var o = vm.repositories[name];
            if (o) {
                if (o.dispose) {
                    o.dispose();
                }
                delete vm.repositories[name];
            }
        },
        clear: function () {
            for (var o in vm.repositories) {
                if (o && o.dispose) {
                    o.dispose();
                }
            }
        }
    };

    return instance;
}


export default new RepositoryManager();
export {
    State,
    StateRepository
}