# rxjs-bus

Wrapper on top of RXJs to propose a versatile and easy to use bus.

## BusManager
### Initialization
#### General
```javascript
  import { BusManager } from "rxjs-bus";

  // Define bus we need
  BusManager.configure({
    bus: [
      {name: "global", options: { withLogs: true }},
      {name: "view1", options: { withLogs: false }}
    ]
  });
```

#### Ephemeral
```javascript
  import { BusManager } from "rxjs-bus";
  
  BusManager.add("view_exchange_child", { withLogs: env.DEBUG !== undefined })
  
  /*** [Later] ***/
  
  BusManager.remove("view_exchange_child");
```

### Use
#### Subscription
```javascript
  import { BusManager } from "rxjs-bus";
  
  let bus = BusManager.get("global");
  let subscription = bus.on("my.beautiful.event", (event) => {
    console.log(event.data)
  });
  
  // You will receive events until you unsubscribe from 
```

#### Emit
```javascript
  import { BusManager } from "rxjs-bus";
  
  let bus = BusManager.get("global");
  
  let data = "Hello !"; // could be anything
  bus.emit("my.beautiful.event", data);
```

#### Once
Once allow to automatically unsubscribe after receiving one event.

```javascript
  import { BusManager } from "rxjs-bus";
  
  let bus = BusManager.get("global");
  bus.once("my.ephemeral.event", (event) => {
    console.log(event.data);
  });
```

#### Raw
Expose directly RxJS api to do even more awesome things with your events!
```javascript
  import { BusManager } from "rxjs-bus";
  import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
  
  let bus = BusManager.get("global");
  
  let subscription =
      bus.raw("my.complex.event")
        .pipe(
          distinctUntilChanged(),
          map((data) => data + data)
          debounceTime(100)
        )
     .subscribe(event => {
        console.log(event.data);
     });
```

Please consult [RxJS documentation](https://www.learnrxjs.io/operators/) for more awesome event management!

#### Scheduling
It is possible to define how the event will be distributed.
The possible values are :
* null
* asap
* async
* queue
* animationFrame

Default value used is null, which represent a synchronous event delivery.

```javascript 
  import { BusManager } from "rxjs-bus";
  
  let bus = BusManager.get("global");
  bus.on("my.async.event", (event) => console.log(event.data), {
    scheduler: BusManager.scheduler.async
  });
```

For more information, please check [RxJS 6 documentation](https://github.com/ReactiveX/rxjs/blob/master/doc/scheduler.md#scheduler-types).

#### Acknowledge
Sometimes, we want to have information back after sending an event... Ack is here to help you with that, without the hassle of creating a dedicated event id, or managing callback lifetime!

```javascript
  import { BusManager } from "rxjs-bus";
  import Dispowser from "dispowser";
  
  let disposer = Dispowser.createDisposer();
  
  let bus = BusManager.get("global");
  let data = "Ping?";
  bus.emit("my.resource.asking.event", data, {
    ack: {
      name: "my.resource.event", // optional, if null or undefined, a guid will be generated
      callback: (event) => console.log(event.data), // Pong! 
      options: { scheduler: BusManager.scheduler.asap }
    }
  });
  
  /*** [Somewhere in the code...] ***/
  
  let bus = BusManager.get("global");
  bus.on("my.resource.asking.event", (event) => {
    let resource = fetchResource();
    if(event.ack) {
      console.log(`Ack ${event.ack.name} available !`);
      event.ack.callback(resource); // will fire an event on the same bus, callback will not work after firing the first event
    }
  });
```

### Subscription management
I recommend to use [Dispowser](https://www.npmjs.com/package/dispowser) to help you manage your subscriptions. It allow to dispose easily without polluting your scope with annoying variables.

```javascript
  import Dispowser from "dispowser";
  
  let disposer = Dispowser.createDisposer();
  disposer.register = bus.on("my.beautiful.event", (event) => console.log(event.data));
  disposer.register = bus.on("my.fantastic.event", (event) => console.log(event.data));
  disposer.register = bus.on("my.extraordinary.event", (event) => console.log(event.data));
  
  /*** [...] ***/

  disposer.dispose();
  // Events won't be received anymore
```

Without Dispowser, do as follow :) 
```javascript
    let subscription = bus.on("my.beautiful.event", (event) => console.log(event.data));
    
    /*** [...] ***/
      
    subscription.unsubscribe();
```

## StateManager
WIP
