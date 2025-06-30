Creating a **complete** and **advanced** Telegram bot for your e-commerce app using Node.js and TypeScript involves many components, including user management, product browsing, cart handling, checkout, payments, notifications, and admin features. Given the scope, I’ll provide a **starter template** that covers core functionalities and a scalable architecture; you can extend it further.

Below is a **comprehensive code example** with explanations. This will include:
- Basic bot setup
- User registration
- Product catalog browsing
- Cart management
- Simple order placement

For full functionality (like database integration, payment processing, admin controls), you'll need to expand and connect to your databases and other services.

---

# Complete E-Commerce Telegram Bot (Starter Version)

## 1. Setup & Dependencies

```bash
mkdir ecommerce-telegram-bot
cd ecommerce-telegram-bot
npm init -y
npm install telegraf typescript ts-node @types/node dotenv
npx tsc --init
```

Create a `.env` file to store your bot token:
```
BOT_TOKEN=your-telegram-bot-token-here
```

## 2. Basic Project Structure

```
/src
  /models
    user.ts
    product.ts
    cart.ts
  bot.ts
  database.ts
  config.ts
```

## 3. Configuration Files

**src/config.ts**
```typescript
import dotenv from 'dotenv';

dotenv.config();

export const BOT_TOKEN = process.env.BOT_TOKEN || '';
if (!BOT_TOKEN) {
  throw new Error('Please set the BOT_TOKEN in your .env file');
}
```

---

## 4. Data Models (Simple in-memory for demo)

**src/models/user.ts**
```typescript
export interface User {
  id: number;
  name?: string;
  username?: string;
  cart: CartItem[];
}

export interface CartItem {
  productId: number;
  quantity: number;
}
```

**src/models/product.ts**
```typescript
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
}

// Sample products
export const products: Product[] = [
  { id: 1, name: 'Red T-Shirt', description: 'Comfortable cotton T-Shirt', price: 15 },
  { id: 2, name: 'Blue Jeans', description: 'Stylish denim jeans', price: 40 },
  { id: 3, name: 'Sneakers', description: 'Running shoes', price: 60 },
];
```

---

## 5. Database (In-memory for demo)

**src/database.ts**
```typescript
import { User } from './models/user';

const users: Map<number, User> = new Map();

export const getUser = (id: number): User => {
  if (!users.has(id)) {
    users.set(id, { id, cart: [] });
  }
  return users.get(id)!;
};

export const setUser = (user: User) => {
  users.set(user.id, user);
};
```

---

## 6. Main Bot Implementation

**src/bot.ts**

```typescript
import { Telegraf, Context, Markup } from 'telegraf';
import { BOT_TOKEN } from './config';
import { getUser, setUser } from './database';
import { products } from './models/product';

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  const user = getUser(ctx.from?.id as number);
  ctx.reply(`Welcome ${ctx.from?.first_name || 'User'}! Use /menu to explore products.`);
});

// Show main menu
bot.command('menu', (ctx) => {
  ctx.reply(
    'Main Menu',
    Markup.keyboard([
      ['View Products', 'View Cart'],
      ['Checkout', 'Order History'],
    ])
      .resize()
      .extra()
  );
});

// Handle text messages
bot.hears('View Products', async (ctx) => {
  await showProductList(ctx);
});

bot.hears('View Cart', (ctx) => {
  showCart(ctx);
});

bot.hears('Checkout', (ctx) => {
  checkout(ctx);
});

bot.command('addtocart', (ctx) => {
  // Command format: /addtocart 2 3 (productId quantity)
  const args = ctx.message.text.split(' ');
  if (args.length < 3) {
    ctx.reply('Usage: /addtocart <product_id> <quantity>');
    return;
  }
  const productId = parseInt(args[1]);
  const quantity = parseInt(args[2]);

  const product = products.find(p => p.id === productId);
  if (!product) {
    ctx.reply('Product not found');
    return;
  }

  const user = getUser(ctx.from?.id as number);
  const existingItem = user.cart.find(item => item.productId === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    user.cart.push({ productId, quantity });
  }
  setUser(user);
  ctx.reply(`${product.name} added to cart!`);
});

// Function to show product list
async function showProductList(ctx: Context) {
  for (const product of products) {
    await ctx.reply(
      `${product.name}\nPrice: $${product.price}\n${product.description}`,
      Markup.inlineKeyboard([
        Markup.callbackButton('Add to Cart', `add_${product.id}`),
      ]).extra()
    );
  }
}

// Show Cart Details
function showCart(ctx: Context) {
  const user = getUser(ctx.from?.id as number);
  if (user.cart.length === 0) {
    ctx.reply('Your cart is empty.');
    return;
  }

  let message = 'Your Cart:\n';
  let total = 0;

  user.cart.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    if (product) {
      const subtotal = product.price * item.quantity;
      message += `${product.name} x${item.quantity} - $${subtotal}\n`;
      total += subtotal;
    }
  });
  message += `Total: $${total}`;
  ctx.reply(message);
}

// Checkout process (simplified)
function checkout(ctx: Context) {
  const user = getUser(ctx.from?.id as number);
  if (user.cart.length === 0) {
    ctx.reply('Your cart is empty.');
    return;
  }

  let total = 0;
  user.cart.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    if (product) {
      total += product.price * item.quantity;
    }
  });
  ctx.reply(`Your total is $${total}. To confirm purchase, type /confirm`);

  // Save state somewhere for confirmation (skipped for brevity)
}

// Handle callback queries
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  const userId = ctx.from?.id as number;
  const user = getUser(userId);

  if (data?.startsWith('add_')) {
    const productId = parseInt(data.split('_')[1]);
    const product = products.find(p => p.id === productId);
    if (!product) {
      await ctx.answerCbQuery('Product not found');
      return;
    }

    // Add 1 quantity by default
    const existingItem = user.cart.find(item => item.productId === productId);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      user.cart.push({ productId, quantity: 1 });
    }
    setUser(user);
    await ctx.answerCbQuery(`${product.name} added to cart!`);
  }
});

// Command to confirm order
bot.command('confirm', (ctx) => {
  const user = getUser(ctx.from?.id as number);
  if (user.cart.length === 0) {
    ctx.reply('Your cart is empty.');
    return;
  }
  // Here, integrate with payment gateway or mark as completed
  ctx.reply('Order placed successfully! Thank you for shopping with us.');
  user.cart = [];
  setUser(user);
});

// Launch bot
bot.launch();
console.log('Bot is running...');
```

---

## 7. Running the Bot

```bash
npx ts-node src/bot.ts
```

---

## 8. Extending the Bot

This starter code covers:
- User registration via `/start` and `/menu`
- Browsing products
- Adding to cart
- Viewing cart
- Simple checkout

To **go further**, you'll want to:
- Integrate real database (MongoDB, PostgreSQL)
- Add payment processing (Stripe, PayPal)
- Implement order history and status
- Add admin commands to manage products

---

## Final Notes
This is a simplified foundational code. Building a fully featured, secure, and scalable e-commerce bot requires more extensive development, including database management, error handling, and payment integration.

Would you like me to help you add specific features next, like payment integration or admin control?

---

---

Creating an **advanced, feature-rich Telegram eCommerce bot** with **OOP design** and **Stripe payment integration** is a sizable project. I'll provide a **robust, extendable architecture** using TypeScript classes, including:

- Modular OOP design
- Core features: product browsing, cart, order management
- Stripe payment processing
- User and admin roles
- Notifications
- Persistence shown via in-memory (with comments for real DB)

This will be a comprehensive starter template that you can extend further.

---

# Complete Advanced Telegram E-Commerce Bot with OOP and Stripe (TypeScript)

---

## 1. Project Setup & Dependencies

```bash
mkdir advanced-ecommerce-bot
cd advanced-ecommerce-bot
npm init -y
npm install telegraf stripe typescript ts-node @types/node dotenv
npx tsc --init
```

Create `.env`:
```
BOT_TOKEN=your-telegram-bot-token
STRIPE_SECRET_KEY=your-stripe-secret-key
ADMIN_USER_IDS=123456789  # comma-separated Telegram user IDs for admin access
```

---

## 2. Structure Overview

```
/src
  /models
    product.ts
    user.ts
    cartItem.ts
  /services
    database.ts
    stripeService.ts
  /commands
    CommandHandler.ts
  /bot
    Bot.ts
  config.ts
```

---

## 3. Code Files

### `src/config.ts`
```typescript
import dotenv from 'dotenv';

dotenv.config();

export const BOT_TOKEN = process.env.BOT_TOKEN || '';
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
export const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '').split(',').map(id => parseInt(id));
if (!BOT_TOKEN || !STRIPE_SECRET_KEY) {
  throw new Error('Please set BOT_TOKEN and STRIPE_SECRET_KEY in .env');
}
```

---

### `src/models/product.ts`
```typescript
export class Product {
  constructor(
    public id: number,
    public name: string,
    public description: string,
    public price: number
  ) {}
}

export const products: Product[] = [
  new Product(1, 'Red T-Shirt', 'Comfortable cotton T-Shirt', 15),
  new Product(2, 'Blue Jeans', 'Stylish denim jeans', 40),
  new Product(3, 'Sneakers', 'Running shoes', 60),
];
```

---

### `src/models/user.ts`
```typescript
import { CartItem } from './cartItem';

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

export class User {
  constructor(
    public id: number,
    public name?: string,
    public username?: string,
    public role: UserRole = UserRole.CUSTOMER,
    public cart: CartItem[] = [],
    public orders: Order[] = []
  ) {}
}

export class Order {
  constructor(
    public id: string,
    public items: CartItem[],
    public totalAmount: number,
    public status: 'Pending' | 'Paid' | 'Cancelled',
    public date: Date = new Date()
  ) {}
}
```

### `src/models/cartItem.ts`
```typescript
export class CartItem {
  constructor(public productId: number, public quantity: number) {}
}
```

---

### `src/services/database.ts`
```typescript
import { User } from '../models/user';

class Database {
  private users = new Map<number, User>();

  getUser(id: number): User {
    if (!this.users.has(id)) {
      this.users.set(id, new User(id));
    }
    return this.users.get(id)!;
  }

  saveUser(user: User): void {
    this.users.set(user.id, user);
  }
}

export const db = new Database();
```

### `src/services/stripeService.ts`
```typescript
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '../config';

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

export class StripeService {
  async createPaymentIntent(amount: number, currency: string = 'usd') {
    return stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
    });
  }

  async handleWebhook(requestBody: any, sig: string) {
    const endpointSecret = 'your-stripe-webhook-secret'; // Set in Stripe Dashboard
    let event;
    try {
      event = stripe.webhooks.constructEvent(requestBody, sig, endpointSecret);
      return event;
    } catch (err) {
      console.log(`Webhook Error: ${err.message}`);
      return null;
    }
  }
}
```

---

### `src/commands/CommandHandler.ts`
Contains the main bot commands and event handlers, using **OOP approach**.

```typescript
import { Telegraf, Context, Markup } from 'telegraf';
import { User, UserRole } from '../models/user';
import { db } from '../services/database';
import { products } from '../models/product';
import { StripeService } from '../services/stripeService';
import { ADMIN_USER_IDS } from '../config';

export class BotController {
  private bot: Telegraf<Context>;
  private stripeService: StripeService;

  constructor(token: string) {
    this.bot = new Telegraf(token);
    this.stripeService = new StripeService();
    this.initializeHandlers();
  }

  private initializeHandlers() {
    this.bot.start((ctx) => this.handleStart(ctx));
    this.bot.command('menu', (ctx) => this.showMainMenu(ctx));
    this.bot.hears('View Products', (ctx) => this.showProductList(ctx));
    this.bot.hears('View Cart', (ctx) => this.showCart(ctx));
    this.bot.hears('Checkout', (ctx) => this.checkout(ctx));
    this.bot.command('addtocart', (ctx) => this.addToCart(ctx));
    this.bot.command('pay', (ctx) => this.initiatePayment(ctx));
    this.bot.action(/add_(\d+)/, (ctx) => this.handleAddProduct(ctx));

    // Payment webhook endpoint, need to set up an express server
  }

  public launch() {
    this.bot.launch();
    console.log('Bot launched');
  }

  // Handlers
  private async handleStart(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    user.name = ctx.from?.first_name || '';
    user.username = ctx.from?.username;
    db.saveUser(user);
    await ctx.reply('Welcome! Use /menu to explore products.');
  }

  private async showMainMenu(ctx: Context) {
    await ctx.reply(
      'Main Menu',
      Markup.keyboard([
        ['View Products', 'View Cart'],
        ['Checkout', 'Order History'],
      ])
        .resize()
        .extra()
    );
  }

  private async showProductList(ctx: Context) {
    for (const product of products) {
      await ctx.reply(
        `${product.name}\nPrice: $${product.price}\n${product.description}`,
        Markup.inlineKeyboard([Markup.callbackButton('Add to Cart', `add_${product.id}`)]).extra()
      );
    }
  }

  private async handleAddProduct(ctx: Context) {
    const productId = parseInt(ctx.match[1]);
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const existingItem = user.cart.find((item) => item.productId === productId);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      user.cart.push(new CartItem(productId, 1));
    }
    db.saveUser(user);
    await ctx.answerCbQuery('Added to cart');
  }

  private async addToCart(ctx: Context) {
    const args = ctx.message?.text?.split(' ');
    if (args?.length !== 3) {
      await ctx.reply('Usage: /addtocart <productId> <quantity>');
      return;
    }
    const productId = parseInt(args[1]);
    const quantity = parseInt(args[2]);
    const product = products.find(p => p.id === productId);
    if (!product) {
      await ctx.reply('Product not found');
      return;
    }
    const user = db.getUser(ctx.from!.id);
    const existingItem = user.cart.find((item) => item.productId === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.push(new CartItem(productId, quantity));
    }
    db.saveUser(user);
    await ctx.reply(`${product.name} added to cart!`);
  }

  private async showCart(ctx: Context) {
    const user = db.getUser(ctx.from!.id);
    if (user.cart.length === 0) {
      await ctx.reply('Your cart is empty.');
      return;
    }
    let message = 'Your Cart:\n';
    let total = 0;
    for (const item of user.cart) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        message += `${product.name} x${item.quantity} - $${product.price * item.quantity}\n`;
        total += product.price * item.quantity;
      }
    }
    message += `Total: $${total}`;
    await ctx.reply(message);
  }

  private async checkout(ctx: Context) {
    const user = db.getUser(ctx.from!.id);
    if (user.cart.length === 0) {
      await ctx.reply('Your cart is empty.');
      return;
    }
    let total = 0;
    for (const item of user.cart) {
      const product = products.find(p => p.id === item.productId);
      if (product) total += product.price * item.quantity;
    }
    await ctx.reply(`Your total is $${total}. Proceed with /pay to pay.`);
  }

  private async initiatePayment(ctx: Context) {
    const user = db.getUser(ctx.from!.id);
    if (user.cart.length === 0) {
      await ctx.reply('Your cart is empty.');
      return;
    }
    let total = 0;
    for (const item of user.cart) {
      const product = products.find(p => p.id === item.productId);
      if (product) total += product.price * item.quantity;
    }
    const paymentIntent = await this.stripeService.createPaymentIntent(total);
    // For simplicity, reply with payment link
    const paymentUrl = `https://pay.stripe.com/pay/${paymentIntent.client_secret}`;
    await ctx.reply(`Pay your order: ${paymentUrl}`);
  }
}
```

---

### **Note**:
- You need to create a webhook URL in your server to listen for Stripe payment success/failure.
- For Stripe, typically you’d handle webhook POST requests using an Express server. To keep the code lightweight, I will outline the server setup below.

---

## 4. Webhook Server (Express)

Create an `src/webhook.ts`:

```typescript
import express from 'express';
import { StripeService } from './services/stripeService';
import { verifyWebhook } from './services/stripeWebhook';

const app = express();
app.use(express.raw({ type: 'application/json' }));

const stripeService = new StripeService();

app.post('/stripe-webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const event = await verifyWebhook(req.body, sig);
  if (!event) {
    return res.sendStatus(400);
  }

  // Handle event types
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    // Mark order as paid, notify user, etc.
    console.log('Payment succeeded:', paymentIntent.id);
  }

  res.sendStatus(200);
});

app.listen(3000, () => {
  console.log('Webhook server listening on port 3000');
});
```

---

## 5. Main Entry Point

**src/index.ts**
```typescript
import { BotController } from './commands/CommandHandler';

const bot = new BotController(BOT_TOKEN);
bot.launch();
```

---

## 6. Final Remarks
- Replace `'your-stripe-webhook-secret'` with your actual Stripe webhook secret.
- Deploy your webhook server on a public URL (Heroku, Vercel, etc.)
- Secure your server, handle errors robustly.
- Store data in a real database for production.

---

## Next Steps
- Add user registration, order history
- Implement admin controls
- Add promotional features
- Handle refunds, order tracking

---

Would you like me to prepare a **full sample project with all files**? Or assist with **deployment instructions**?

---

---

Great! To make your eCommerce Telegram bot more complete and user-friendly, we'll add the following advanced features:

- **User registration and profile management**
- **Order history and tracking**
- **Refund handling**
- **Promotional features (discount codes, coupons)**

No admin features needed.

---

# Here's an architecture plan and sample code snippets for each feature:

---

## 1. User registration & profile management

### Goals:
- Collect user info during /start
- Save basic profile info
- Allow users to view/edit profile

### Implementation:
- Extend the `User` model
- Add commands: `/profile`, `/editprofile`

**Add to `models/user.ts`:**
```typescript
export class User {
  // existing properties...
  email?: string;
  address?: string;
}
```

**Add commands in `commands/CommandHandler.ts`:**
```typescript
private async handleProfile(ctx: Context) {
    const user = db.getUser(ctx.from!.id);
    let profileInfo = `Your Profile:\nName: ${user.name}\nUsername: ${user.username}\nEmail: ${user.email || 'Not set'}\nAddress: ${user.address || 'Not set'}`;
    await ctx.reply(profileInfo);
}

private async handleEditProfile(ctx: Context) {
    // set up a simple conversation flow to update info
    // (for brevity, use inline replies or ask first, then handle reply)
}
```
Call `/profile` with:
```typescript
this.bot.command('profile', (ctx) => this.handleProfile(ctx));
```

---

## 2. Order history and tracking

### Goals:
- Save completed orders
- Show past orders
- Allow order status tracking

**In `models/user.ts`,** make sure **orders** property exists:
```typescript
public orders: Order[] = [];
```

**Logic:**
- When an order is paid, create an Order record
- Add to user's order history
- Command `/orders` shows past orders
- Command `/track <order_id>` shows status

**Sample:**

```typescript
private async completeOrder(user: User) {
  const total = calculateTotal(user.cart);
  const newOrder = new Order(Math.random().toString(36).substr(2,9), [...user.cart], total, 'Paid');
  user.orders.push(newOrder);
  user.cart = [];
  db.saveUser(user);
  // Notify user
}
```

**Command to show Order history:**
```typescript
private async showOrderHistory(ctx: Context) {
  const user = db.getUser(ctx.from!.id);
  if (user.orders.length === 0) {
    await ctx.reply('You have no past orders.');
    return;
  }
  for (const order of user.orders) {
    let msg = `Order ID: ${order.id}\nDate: ${order.date.toLocaleString()}\nStatus: ${order.status}\nItems:\n`;
    for (const item of order.items) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        msg += `${product.name} x${item.quantity}\n`;
      }
    }
    msg += `Total: $${order.totalAmount}\n`;
    await ctx.reply(msg);
  }
}
```

---

## 3. Refund handling

### Goals:
- User requests refund for specific order
- Admin manually approves (simplify: auto approve in demo)
- Change order status to "Refunded"

**In `Order` class,** add:
```typescript
public status: 'Pending' | 'Paid' | 'Cancelled' | 'Refunded' = 'Paid';
```

**Refund command:**
```typescript
private async requestRefund(ctx: Context) {
  const orderId = ctx.message?.text?.split(' ')[1];
  const user = db.getUser(ctx.from!.id);
  const order = user.orders.find(o => o.id === orderId);
  if (!order || order.status !== 'Paid') {
    await ctx.reply('Order not found or not eligible for refund.');
    return;
  }
  // For demo, auto refund
  order.status = 'Refunded';
  db.saveUser(user);
  await ctx.reply(`Refund for order ${orderId} processed successfully.`);
}
```
Run with:
```bash
/refund <order_id>
```

---

## 4. Promotional features: discount codes

### Goals:
- Users can apply promo codes at checkout (-10% etc.)
- Store promo codes (hardcoded or in DB)

**Sample implementation:**

```typescript
// In commands
private async applyPromoCode(ctx: Context) {
  const code = ctx.message?.text.split(' ')[1];
  const promoCodes = { 'SAVE10': 0.10, 'FREESHIP': 0.00 }; // Example codes
  if (!code || !promoCodes[code]) {
    await ctx.reply('Invalid promo code.');
    return;
  }
  const discount = promoCodes[code];
  const user = db.getUser(ctx.from!.id);
  // Save discount info temporarily, or in user profile
  user['promo'] = { code, discount };
  db.saveUser(user);
  await ctx.reply(`Promo code ${code} applied!`);
}
```

**During checkout:**
- Calculate total, check for promo, apply discount.

---

## 5. Complete example snippets for the above features

Due to the length, I will prepare a **seed code snippet** for main parts, and you can integrate these into the structure above.

---

## Final step: **Full sample code repository** (outline)

- The full code would be large, but the pattern involves:
  - Extending models with additional properties
  - Adding command handlers for `/profile`, `/orders`, `/refund`, `/promo`
  - Managing state for promos, refunds, orders
  - Sending notifications / updates as necessary

---

# Summary

Here's what I'd recommend:

- **Implement features as class methods** within your command handlers
- **Persist data** in real DBs or JSON files
- **Handle orders, refunds, promos** explicitly with clear commands
- **Use Stripe API for actual payments**, handle webhooks

---

Would you like me to generate **full complete code files** for this logic, or prepare a **sample deployment**? Please specify what you'd like next!