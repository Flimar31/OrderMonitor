const ArticleCmp = {
  props: ["article"],
  computed: {
    articleIcon() {
      switch (this.article.name) {
        case "Burger":
          switch (this.article.type) {
            case "Burger":
              return this.article.double ? "burger_double" : "burger";
            case "CheeseBurger":
              return this.article.double ? "cheese_double" : "cheese";
            case "ChickenBurger":
              return this.article.double ? "chicken_double" : "chicken";
            default:
              return "invalid";
          }
        case "Soda":
          return "soda";
        case "IceCream":
          switch (this.article.type) {
            case "Strawberry":
              return "icecream_strawberry";
            case "Milky":
              return "icecream_milky";
            default:
              return "invalid";
          }
        case "Potatoes":
          return "potatoes";
        case "Nugget":
          return "nugget";
        case "Coffee":
          return "coffee_cup";
        default:
          return "invalid";
      }
    },
    articleLabel() {
      let base = "";
      switch (this.article.name) {
        case "Burger":
          switch (this.article.type) {
            case "Burger":
              return this.article.double ? "Double Hamburger" : "Hamburger";
            case "CheeseBurger":
              return this.article.double ? "Double Cheesburger" : "Cheesburger";
            case "ChickenBurger":
              return this.article.double
                ? "Double Chicken Burger"
                : "Chicken Burger";
            default:
              return "?";
          }
        case "Soda":
          switch (this.article.type) {
            case "SplashCola":
              return "Splash Cola";
            case "LightSplashCola":
              return "Light Splash Cola";
            case "Youma":
              return "Youma";
            case "YoumaBerry":
              return "Youma Berry";
            case "Water":
              return "Water";
            case "MrHoop":
              return "Mr Hoop";
            default:
              return "?";
          }
        case "IceCream":
          base = "Ice Cream";
          switch (this.article.type) {
            case "Strawberry":
              return `Strawberry ${base}`;
            case "Milky":
              return `Vanilla ${base}`;
            default:
              return "?";
          }
        case "Potatoes":
          base = "French Fries";
          switch (this.article.type) {
            case "Small":
              return `${base} (Small)`;
            case "Medium":
              return `${base} (Medium)`;
            case "Large":
              return `${base} (Large)`;
            default:
              return "?";
          }
        case "Nugget":
          return "Chicken Nugget";
        case "Coffee":
          base = "Coffee";
          if (this.article.milkAmount > 0) {
            return `${base} with ${
              this.article.milkAmount == 2 ? "Extra " : ""
            }Milk`;
          } else if (this.article.coffeeAmount == 2) {
            return `Doubleshot ${base}`;
          }
          return base;
        default:
          return "?";
      }
    },
    formattedProducts() {
      let products = [];
      switch (this.article.name) {
        case "Burger":
          if (!this.article.products) {
            return products;
          }
          this.article.products.forEach((product) => {
            let icon = "invalid";
            switch (product.name) {
              case "Sauce":
                switch (product.type) {
                  case "Ketchup":
                    icon = "ketchup";
                    break;
                  case "Mustard":
                    icon = "mustard";
                    break;
                  case "Mayonnaise":
                    icon = "mayonnaise";
                    break;
                }
                break;
              case "Lettuce":
                icon = "lettuce";
                break;
              case "Onion":
                icon = "onion";
                break;
              case "Pickle":
                icon = "pickle";
                break;
              case "Tomato":
                icon = "tomato";
                break;
            }
            products.push({
              icon: icon,
              quantity: product.quantity,
            });
          });
        case "Soda":
          if (this.article.iceAmount > 0) {
            products.push({
              icon: "ice",
              quantity: this.article.iceAmount,
            });
          }
          return products;
        case "Coffee":
          if (this.article.coffeeAmount > 0) {
            products.push({
              icon: "coffee",
              quantity: this.article.coffeeAmount,
            });
          }
          if (this.article.milkAmount > 0) {
            products.push({
              icon: "milk",
              quantity: this.article.milkAmount,
            });
          }
          return products;
        case "IceCream":
        case "Potatoes":
        case "Nugget":
        default:
          return products;
      }
    },
  },
  methods: {
    toggleDone() {
      if (!this.article) return;
      this.article._done = !this.article._done;
    },
  },
  template: `
    <div class="article" :class="{ done: article._done }" @click.stop="toggleDone">
        <div>
            <img :src="'UI/assets/'+articleIcon+'.png'" :title="articleLabel" :alt="articleLabel" />
            <span class="outlined">{{articleLabel}}</span>
        </div>
        <div>
            <div class="product-wrapper"v-for="(product, i) in formattedProducts" :key="i+'-'+product.icon">
                <img :src="'UI/assets/'+product.icon+'.png'" :title="product.icon" :alt="product.icon" />
                <span class="outlined">x{{product.quantity}}</span>
            </div>
        </div>
    </div>
  `,
};

const OrderCmp = {
  props: ["order"],
  setup(props) {
    return {
      open: ref(true),
    };
  },
  mounted() {
    // For global access and to derive time deltas from a single source
    if (!window.__vue_app__) window.__vue_app__ = this.$root;
    // ensure when an order is freshly created/updated it opens automatically
    this.$watch('order._createdAt', function (newVal, oldVal) {
      if (newVal && newVal !== oldVal) this.open = true;
    });

    // If showFilteredHeader is enabled and this order has no visible articles, keep it closed
    const showHeaderOption = (window.__vue_app__ && window.__vue_app__.itemFilters) ? window.__vue_app__.itemFilters.showFilteredHeader : false;
    if (showHeaderOption && this.filteredArticles.length === 0) {
      this.open = false;
    }

    // react to changes in filtered articles and update open state accordingly
    this.$watch(() => this.filteredArticles.length, (newLen) => {
      const showHeader = (window.__vue_app__ && window.__vue_app__.itemFilters) ? window.__vue_app__.itemFilters.showFilteredHeader : false;
      if (showHeader && newLen === 0) {
        this.open = false;
      } else if (newLen > 0) {
        this.open = true;
      }
    });
  },
  computed: {
    table() {
      return this.order.table - (this.order.drive ? 99 : 0);
    },
    showHeaderOnly() {
      const filters = (window.__vue_app__ && window.__vue_app__.itemFilters) ? window.__vue_app__.itemFilters : {};
      return (this.filteredArticles.length === 0) && !!filters.showFilteredHeader;
    },
    parsedTime() {
      // if order hasn't a validated time, don't show the default 09:00 — show a clear 'En attente'
      if (!this.order || this.order.time === undefined || this.order.time <= 0) return "En attente";
      return parseGameTime(this.order.time);
    },
    // seconds elapsed since the order was created (uses _createdAt set in app.updateOrders)
    waitingSeconds() {
      if (!this.order) return 0;
      let root = (this.$root) ? this.$root : window.__vue_app__;
      let nowTS = (root && typeof root.nowTS !== 'undefined') ? root.nowTS : Date.now();
      // prefer explicit _createdAt (wall-clock ms) assigned when the order first appeared
      let created = this.order._createdAt || Date.now();
      let diff = Math.floor((nowTS - created) / 1000);
      if (isNaN(diff) || diff < 0) return 0;
      return diff;
    },
    waitingTimeStr() {
      // show elapsed time since creation starting at 00:00 and incrementing each second
      let s = this.waitingSeconds;
      if (s <= 0) return '00:00';
      if (s >= 3600) {
        let h = Math.floor(s / 3600);
        let m = Math.floor((s % 3600) / 60);
        return `${h}h ${m}m`;
      }
      let mm = Math.floor(s / 60);
      let ss = s % 60;
      return (mm < 10 ? '0' + mm : mm) + ':' + (ss < 10 ? '0' + ss : ss);
    },
    // color for waiting-time: green <60s, interpolate yellow->red between 60s and 180s, red >=180s
    waitingColor() {
      let s = this.waitingSeconds;
      // green
      const green = [0, 204, 0]; // #00cc00
      const yellow = [255, 215, 0]; // #ffd700
      const red = [255, 51, 51]; // #ff3333
      if (s < 60) return 'rgb(' + green.join(',') + ')';
      if (s >= 180) return 'rgb(' + red.join(',') + ')';
      // interpolate between yellow and red from 60..180
      let t = (s - 60) / (180 - 60);
      let r = Math.round(yellow[0] + (red[0] - yellow[0]) * t);
      let g = Math.round(yellow[1] + (red[1] - yellow[1]) * t);
      let b = Math.round(yellow[2] + (red[2] - yellow[2]) * t);
      return `rgb(${r},${g},${b})`;
    },

    // background color for the header: gradually goes from gray to red over 0..120s (2 minutes)
    headerBgColor() {
      let s = this.waitingSeconds;
      const gray = [66, 68, 67]; // #424443
      const red = [255, 51, 51]; // #ff3333
      let t = Math.min(Math.max(s / 120, 0), 1);
      let r = Math.round(gray[0] + (red[0] - gray[0]) * t);
      let g = Math.round(gray[1] + (red[1] - gray[1]) * t);
      let b = Math.round(gray[2] + (red[2] - gray[2]) * t);
      return `rgb(${r},${g},${b})`;
    },

    // percentage (0-100) of the timer progress bar that fills left->right; default full at 110s (1:50) but if there's an avg leave we use avg+10s
    timerProgress() {
      let s = this.waitingSeconds;
      const root = (this.$root) ? this.$root : window.__vue_app__;
      let avg = 0;
      try {
        if (root && root.leftCount) {
          avg = Math.round((root.leftTotalSeconds || 0) / (root.leftCount || 1));
        }
      } catch (e) {
        avg = 0;
      }
      const max = (avg && avg > 0) ? (avg + 10) : 110; // use avg+10s if available
      let p = Math.min(Math.max(s / max, 0), 1);
      return Math.round(p * 100);
    },


    // gradient background filling left->right from gray to muted red over 0..110s
    headerGradient() {
      let p = this.timerProgress;
      const red = 'rgba(196,75,60,0.95)';
      const gray = '#424443';
      return `linear-gradient(90deg, ${red} 0%, ${red} ${p}%, ${gray} ${p}%, ${gray} 100%)`;
    },

    // timer text is fixed to white via CSS for maximum readability


    cost() {
      return (Math.floor(this.order.cost * 100) / 100).toFixed(2);
    },
    hasBurger() {
      return (this.order && this.order.articles) ? this.order.articles.some((a) => a.name === 'Burger') : false;
    },

    isNoBurger() {
      const arts = (this.order && this.order.articles) ? this.order.articles : [];
      // only in-house (not drive) orders with NO burger should be yellow
      return !this.order.drive && !arts.some((a) => a.name === 'Burger');
    },

    summaryIcons() {
      const icons = new Set();
      (this.order && this.order.articles || []).forEach((a) => {
        switch (a.name) {
          case 'Burger':
            icons.add('burger');
            break;
          case 'Soda':
            icons.add('soda');
            break;
          case 'Potatoes':
            icons.add('potatoes');
            break;
          case 'Nugget':
            icons.add('nugget');
            break;
          case 'Coffee':
            // use same asset as product icons
            icons.add('coffee');
            break;
          case 'IceCream':
            icons.add('icecream_strawberry');
            break;
          default:
            break;
        }
      });
      return Array.from(icons);
    },

    filteredArticles() {
      // Récupère les filtres actifs depuis l'app principale
      const filters = (window.__vue_app__ && window.__vue_app__.itemFilters) ? window.__vue_app__.itemFilters : {
        burger: true,
        nugget: true,
        soda: true,
        icecream: true,
        potatoes: true,
        coffee: true,
      };
      return this.order.articles.filter((art) => {
        if (art.name === "Burger") return filters.burger;
        if (art.name === "Nugget") return filters.nugget;
        if (art.name === "Soda") return filters.soda;
        if (art.name === "IceCream") return filters.icecream;
        if (art.name === "Potatoes") return filters.potatoes;
        if (art.name === "Coffee") return filters.coffee;
        return false;
      });
    },
  },
  mounted() {
    // Pour accès global aux filtres depuis l'app principale
    if (!window.__vue_app__) window.__vue_app__ = this.$root;
  },
  template: `
        <div class="order" :class="{ 'new-arrival': waitingSeconds < 3, 'card-drive': order.drive, 'card-drive-no-burger': order.drive && !hasBurger, 'card-no-burger': isNoBurger, 'card-burger': hasBurger && !order.drive, 'card-header-only': showHeaderOnly }">
            <div class="order-header" :style="{ background: headerGradient }">
                <div class="accordion-arrow" :class="{ open: open }" v-if="filteredArticles.length" />
                <h2 class="flex-grow">{{order.drive ? "Drive Thru" : "Table No."}} {{table}}</h2>
                <div class="order-icons" v-if="summaryIcons.length">
                    <img v-for="(ic, i) in summaryIcons" :key="i+'-'+ic" :src="'UI/assets/'+ic+'.png'" :alt="ic" class="order-icon" />
                </div>
                <div class="type-icon">
                    <div class="icon" :class="{ car: order.drive, ped: !order.drive }" />
                </div>
                <div class="time">
                    <div>{{parsedTime}}</div>
                    <div class="waiting-time">{{waitingTimeStr}}</div>
                </div>
                <div class="cost">
                    \${{cost}}
                </div>
                <div class="accordion-trigger cursor-pointer" @click="open = !open" v-if="filteredArticles.length" />
            </div>
            <div class="order-details" v-if="open">
                <ArticleCmp v-for="(art, i) in filteredArticles"
                    :key="i+'-'+art.name"
                    :article="art" />
            </div>
        </div>
    `,
};

const OrdersCmp = {
  props: ["orders"],
  computed: {
    // return left / right columns based on per-order _col assignment (stable)
    leftColumn() {
      return (this.orders || []).filter((o) => o._col === 'L').slice().sort((a, b) => ((a._createdAt || 0) - (b._createdAt || 0)));
    },
    rightColumn() {
      return (this.orders || []).filter((o) => o._col === 'R').slice().sort((a, b) => ((a._createdAt || 0) - (b._createdAt || 0)));
    },
  },
  template: `
        <div class="container">
            <div class="header-spacing" />
            <div class="orders-grid">
                <div class="orders-column">
                    <OrderCmp v-for="order in leftColumn" :key="'l-'+order.id" :order="order" />
                </div>
                <div class="orders-column">
                    <OrderCmp v-for="order in rightColumn" :key="'r-'+order.id" :order="order" />
                </div>
            </div>
        </div>
    `,
};
