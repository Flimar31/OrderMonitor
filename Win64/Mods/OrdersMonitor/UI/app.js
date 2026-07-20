let app = {
  setup() {
    let showDriveThru = localStorage.getItem("driveThruState");
    if (showDriveThru === undefined) {
      showDriveThru = true;
    } else {
      showDriveThru = showDriveThru === "true";
    }

    let showOther = localStorage.getItem("otherState");
    if (showOther === undefined) {
      showOther = true;
    } else {
      showOther = showOther === "true";
    }

    // Load item filters from localStorage (default: all enabled)
    let storedFilters = localStorage.getItem("itemFilters");
    let itemFilters = storedFilters ? JSON.parse(storedFilters) : {
      burger: true,
      nugget: true,
      soda: true,
      icecream: true,
      potatoes: true,
      coffee: true,
      // if true, show the order header even when all articles are filtered out
      showFilteredHeader: false,
    };

    // Load zoom level from localStorage (default: 1.0)
    let storedZoom = localStorage.getItem("zoomLevel");
    // default to 70% zoom for better initial layout
    let zoomLevel = storedZoom ? parseFloat(storedZoom) : 0.7;

    return {
      showDriveThru: ref(showDriveThru),
      showOther: ref(showOther),
      itemFilters: ref(itemFilters),
      zoomLevel: ref(zoomLevel),
      fetchProcess: ref(),
      orders: ref([]),
      notifications: ref([]),
      showHistory: ref(false),
      // tracking current game time (based on events) for live waiting timers
      gameTime: ref(0),
      gameTimeTS: ref(Date.now()),
      // wall-clock now timestamp (updated every second) to drive UI timers
      nowTS: ref(Date.now()),
      // stats for customers who left (count and total seconds)
      leftCount: ref(0),
      leftTotalSeconds: ref(0),
    }; 
  },
  methods: {
    toggle(drive) {
      if (drive) {
        this.showDriveThru = !this.showDriveThru;
        localStorage.setItem("driveThruState", this.showDriveThru);
      } else {
        this.showOther = !this.showOther;
        localStorage.setItem("otherState", this.showOther);
      }
    },
    toggleFilter(itemType) {
      this.itemFilters[itemType] = !this.itemFilters[itemType];
      localStorage.setItem("itemFilters", JSON.stringify(this.itemFilters));
    },
    resetFilters() {
      this.itemFilters = {
        burger: true,
        nugget: true,
        soda: true,
        icecream: true,
        potatoes: true,
        coffee: true,
        showFilteredHeader: false,
      };
      localStorage.setItem("itemFilters", JSON.stringify(this.itemFilters));
    },
    zoomIn() {
      if (this.zoomLevel < 1.0) {
        this.zoomLevel = Math.min(1.0, this.zoomLevel + 0.1);
        localStorage.setItem("zoomLevel", this.zoomLevel);
      }
    },
    zoomOut() {
      if (this.zoomLevel > 0.5) {
        this.zoomLevel = Math.max(0.5, this.zoomLevel - 0.1);
        localStorage.setItem("zoomLevel", this.zoomLevel);
      }
    },
    orderMatchesFilters(order) {
      // Vérifie si la commande contient au moins un article du type filtré
      return order.articles.some((article) => {
        // Hamburger
        if (article.name === "Burger") return this.itemFilters.burger;
        // Chicken Nugget
        if (article.name === "Nugget") return this.itemFilters.nugget;
        // Soda (tous types)
        if (article.name === "Soda") return this.itemFilters.soda;
        // Ice Cream (tous types)
        if (article.name === "IceCream") return this.itemFilters.icecream;
        // French Fries (Potatoes)
        if (article.name === "Potatoes") return this.itemFilters.potatoes;
        // Café
        if (article.name === "Coffee") return this.itemFilters.coffee;
        return false;
      });
    },
    updateOrders(newOrders) {
      // Preserve creation timestamps and column assignment so timers start at 0
      // and columns remain stable when orders are added/removed.
      const prev = this.orders || [];
      const now = Date.now();

      // build current counts for existing columns
      let leftCount = 0;
      let rightCount = 0;
      prev.forEach((p) => {
        if (p && p._col === 'L') leftCount++;
        if (p && p._col === 'R') rightCount++;
      });

      // map and assign columns deterministically for new orders
      let mapped = newOrders.map((o) => {
        // Try to find an existing order by table + drive flag (best-effort match)
        let existing = prev.find((p) => p.table === o.table && p.drive === o.drive);
        let newOrder = Object.assign({}, o);
        if (existing && existing._createdAt) {
          newOrder._createdAt = existing._createdAt;
        } else {
          newOrder._createdAt = now;
        }

        if (existing && existing._col) {
          // preserve previous column assignment
          newOrder._col = existing._col;
        } else {
          // assign to the smaller column to balance initial load, left preferred on tie
          if (leftCount <= rightCount) {
            newOrder._col = 'L';
            leftCount++;
          } else {
            newOrder._col = 'R';
            rightCount++;
          }
        }

        // carry over per-article done flags from existing order if present
        try {
          if (existing && existing.articles && newOrder.articles) {
            newOrder.articles = newOrder.articles.map((a, idx) => {
              const prevArt = existing.articles[idx];
              if (prevArt && prevArt._done) {
                a._done = prevArt._done;
              }
              return a;
            });
          }
        } catch (err) {
          // safe guard - ignore if anything goes wrong
          console.warn('Preserve _done failed', err);
        }

        return newOrder;
      });
      this.orders = mapped;
    },
    getOrders() {
      let res = [];
      this.orders.forEach((order) => {
        // Check drive/other filter
        let showOrder = false;
        if (order.drive) {
          showOrder = this.showDriveThru;
        } else {
          showOrder = this.showOther;
        }
        
        // Check item filters
        // If showFilteredHeader is enabled, include orders even if none of their articles match the item filters
        if (showOrder && (this.orderMatchesFilters(order) || this.itemFilters.showFilteredHeader)) {
          res.push(order);
        }
      });
      return res;
    },
  },
  mounted() {
    let fetchOrders = () => {
      if (!window.FILE_ERRORS) {
        window.FILE_ERRORS = {};
      }
      if (window.FILE_ERRORS.length > 0) {
        clearInterval(this.fetchProcess);
        return;
      }

      function upsertScript(id, file) {
        // remove previous
        let existant = document.querySelector(`script#${id}`);
        if (existant) {
          existant.remove();
        }

        // create orders script
        let script = document.createElement("script");
        script.id = id;
        script.src = file;
        script.innerHTML = `alert('${file} can't be found, please check your mod installation.'); window.FILE_ERRORS["${id}"] = true;`;
        document.body.appendChild(script);
      }

      upsertScript("get-orders", "orders_export.js");
      upsertScript("get-events", "events_export.js");

      setTimeout(() => {
        // Read orders and events; map validated times to orders so displayed time matches History
        let events = [];
        if (window.GET_EVENTS) {
          events = window.GET_EVENTS();

          // enrich new 'left' events with the elapsed seconds from the matching order's _createdAt
          // so the notification contains the exact timer used when the event was first seen
          try {
            const prevEvents = this.notifications || [];
            const nowTs = this.nowTS || Date.now();
            events.forEach((ev) => {
              const exists = prevEvents.find(
                (n) => n.time === ev.time && n.event === ev.event && n.table === ev.table
              );
              if (!exists) {
                if ((ev.event === "ped_left" || ev.event === "car_left") && ev.table !== undefined) {
                  // try to find the order by table (or drive offset)
                  let found = (this.orders || []).find((o) => o.table === ev.table);
                  if (!found) {
                    found = (this.orders || []).find((o) => (o.table - 99) === (ev.table - 99));
                  }
                  if (found && found._createdAt) {
                    ev.elapsed = Math.floor((nowTs - found._createdAt) / 1000);
                    // update aggregate stats for header display
                    this.leftCount = (this.leftCount || 0) + 1;
                    this.leftTotalSeconds = (this.leftTotalSeconds || 0) + ev.elapsed;
                  }
                }
              }
            });
          } catch (err) {
            // safe guard - do nothing on error
            console.warn('Enrich events failed', err);
          }

          this.notifications = events;
        }

        if (window.GET_ORDERS) {
          let orders = window.GET_ORDERS();

          // build map of latest ped_order_validated times by table
          let validated = {};
          if (events && events.length) {
            events.forEach((e) => {
              if (e.event === "ped_order_validated" && e.table !== undefined) {
                validated[e.table] = e.time;
              }
            });

            // update global game time reference (use max event time)
            let maxTime = Math.max(...events.map((e) => e.time || 0), 0);
            this.gameTime = maxTime;
            this.gameTimeTS = Date.now();
          }

          // apply validated times to orders when available
          orders = orders.map((o) => {
            try {
              let newOrder = Object.assign({}, o);
              if (validated[newOrder.table] !== undefined) {
                newOrder.time = validated[newOrder.table];
              }
              return newOrder;
            } catch (err) {
              return o;
            }
          });

          this.updateOrders(orders);
        }
      }, 20);
    };
    this.fetchProcess = setInterval(fetchOrders, 500);
    fetchOrders();

    // expose root for convenience so components can reference times
    window.__vue_app__ = this;

    // keep a wall-clock timestamp updated so components can derive elapsed times reactively
    this._nowInterval = setInterval(() => {
      this.nowTS = Date.now();
    }, 1000);
  },
  beforeDestroy() {
    clearInterval(this.fetchProcess);
    if (this._nowInterval) clearInterval(this._nowInterval);
  },
  template: `
    <div class="zoom-viewport">
      <div class="zoom-content" :style="{ transform: 'scale(' + zoomLevel + ')', transformOrigin: 'top left', '--zoom-level': zoomLevel }">
        <HeaderCmp 
            :driveThruState="showDriveThru"
            :otherState="showOther"
            :itemFilters="itemFilters"
            :zoomLevel="zoomLevel"
            :avgLeaveSeconds="leftCount ? Math.round(leftTotalSeconds / leftCount) : 0"
            @toggle="toggle($event)"
            @toggle-filter="toggleFilter($event)"
            @reset-filters="resetFilters()"
            @zoom-in="zoomIn()"
            @zoom-out="zoomOut()"
            @open-history="showHistory = true"/>
        <OrdersCmp :orders="getOrders()" />
        <NotifCmp :notifications="notifications" />
        <HistoryCmp
          :show="showHistory"
          :notifications="notifications"
          @close="showHistory = false" />
      </div>
    </div>
    `,
};

const { createApp, ref } = Vue;
createApp(app)
  .component("CheckCmp", CheckCmp)
  .component("HeaderCmp", HeaderCmp)
  .component("ArticleCmp", ArticleCmp)
  .component("OrderCmp", OrderCmp)
  .component("OrdersCmp", OrdersCmp)
  .component("NotifCmp", NotifCmp)
  .component("HistoryCmp", HistoryCmp)
  .mount("#app");
