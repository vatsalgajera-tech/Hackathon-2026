/**
 * VendorBridge AI — Comprehensive Database Seed
 * Users: vatsal, prince, yash, neil → [name]@gmail.com / [name]123
 * 25 vendors, 12 RFQs, 40+ quotations, POs, invoices, activity logs
 */
require('dotenv').config();
const mongoose = require('mongoose');

// ── Models ──────────────────────────────────────────────────────────────────
const User     = require('./models/User');
const Vendor   = require('./models/Vendor');
const RFQ      = require('./models/RFQ');
const Quotation= require('./models/Quotation');
const PurchaseOrder = require('./models/PurchaseOrder');
const Invoice  = require('./models/Invoice');
const Activity = require('./models/Activity');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vendorbridge';

// ── Helpers ──────────────────────────────────────────────────────────────────
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const future = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return d; };
const past   = (days) => { const d = new Date(); d.setDate(d.getDate() - days); return d; };

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // ── WIPE ──────────────────────────────────────────────────────────────────
  await Promise.all([
    User.deleteMany({}), Vendor.deleteMany({}), RFQ.deleteMany({}),
    Quotation.deleteMany({}), PurchaseOrder.deleteMany({}),
    Invoice.deleteMany({}),
  ]);
  // ActivityLog may not exist, ignore
  try { await Activity.deleteMany({}); } catch {}
  console.log('🗑️  Cleared all collections');

  // ── USERS ─────────────────────────────────────────────────────────────────
  const USERS_DEF = [
    { name: 'Vatsal Gajera', username: 'vatsal', role: 'admin' },
    { name: 'Prince Sharma', username: 'prince', role: 'manager' },
    { name: 'Yash Patel',    username: 'yash',   role: 'procurement_officer' },
    { name: 'Neil Desai',    username: 'neil',   role: 'vendor' },
  ];

  const users = [];
  for (const u of USERS_DEF) {
    const doc = await User.create({
      name: u.name,
      email: `${u.username}@gmail.com`,
      password: `${u.username}123`,   // model pre-save hook hashes this
      role: u.role,
    });
    users.push(doc);
    console.log(`👤 ${u.role.padEnd(20)} ${u.name} — ${u.username}@gmail.com / ${u.username}123`);
  }

  const [vatsal, prince, yash, neil] = users;

  // ── 25 VENDORS ───────────────────────────────────────────────────────────
  const VENDORS_DEF = [
    // IT & Software
    { companyName: 'TechSupply Solutions Pvt Ltd', category: 'IT & Software',    contact: 'Arjun Mehta',    email: 'arjun@techsupply.in',    phone: '9876543210', city: 'Bengaluru',  state: 'Karnataka',   gst: '29AAACT1234F1ZV', rating: 4.8, co: 48, to: 50, del: 2, rq: 18, tq: 22, status: 'active' },
    { companyName: 'Infosys Technologies Vendor',  category: 'IT & Software',    contact: 'Priya Nair',     email: 'priya@infovend.com',     phone: '9865432109', city: 'Pune',       state: 'Maharashtra', gst: '27AAACN5678G2ZW', rating: 4.5, co: 42, to: 46, del: 4, rq: 12, tq: 16, status: 'active' },
    { companyName: 'CyberNet Systems',             category: 'IT & Software',    contact: 'Rohan Verma',    email: 'rohan@cybernet.io',      phone: '9845321098', city: 'Hyderabad', state: 'Telangana',   gst: '36AAACR9012H3ZX', rating: 4.2, co: 33, to: 38, del: 5, rq: 10, tq: 15, status: 'active' },

    // Hardware
    { companyName: 'PrecisionMake Industries',     category: 'Hardware',         contact: 'Mohan Singh',    email: 'mohan@precisionmake.com',phone: '9823210987', city: 'Nagpur',     state: 'Maharashtra', gst: '27AAACP3456I4ZY', rating: 4.1, co: 29, to: 31, del: 2, rq: 8,  tq: 11, status: 'active' },
    { companyName: 'BuildRight Components',        category: 'Hardware',         contact: 'Sanjay Gupta',   email: 'sanjay@buildright.in',   phone: '9812109876', city: 'Surat',      state: 'Gujarat',     gst: '24AAACB7890J5ZZ', rating: 3.9, co: 21, to: 26, del: 5, rq: 9,  tq: 13, status: 'active' },
    { companyName: 'TechParts Hub',                category: 'Hardware',         contact: 'Kavita Joshi',   email: 'kavita@techparts.co.in', phone: '9801098765', city: 'Ahmedabad',  state: 'Gujarat',     gst: '24AAACT2345K6ZA', rating: 4.4, co: 38, to: 41, del: 3, rq: 15, tq: 19, status: 'active' },

    // Office Supplies
    { companyName: 'OfficeEase Supplies',          category: 'Office Supplies',  contact: 'Sunita Rao',     email: 'sunita@officeease.com',  phone: '9789876543', city: 'Chennai',    state: 'Tamil Nadu',  gst: '33AAACO6789L7ZB', rating: 4.5, co: 54, to: 56, del: 2, rq: 20, tq: 23, status: 'active' },
    { companyName: 'StationPro India',             category: 'Office Supplies',  contact: 'Deepak Sharma',  email: 'deepak@stationpro.in',   phone: '9778765432', city: 'Delhi',      state: 'Delhi',       gst: '07AAACS1234M8ZC', rating: 4.3, co: 47, to: 50, del: 3, rq: 17, tq: 21, status: 'active' },
    { companyName: 'PaperWorld Distributors',      category: 'Office Supplies',  contact: 'Meera Pillai',   email: 'meera@paperworld.in',    phone: '9767654321', city: 'Kochi',      state: 'Kerala',      gst: '32AAACP5678N9ZD', rating: 3.7, co: 18, to: 25, del: 7, rq: 8,  tq: 12, status: 'active' },

    // Logistics
    { companyName: 'Swift Logistics Pvt Ltd',      category: 'Logistics',        contact: 'Keshav Iyer',    email: 'keshav@swiftlogistics.in',phone: '9756543210', city: 'Mumbai',     state: 'Maharashtra', gst: '27AAACS9012O0ZE', rating: 3.9, co: 18, to: 22, del: 4, rq: 12, tq: 16, status: 'active' },
    { companyName: 'FastMove Cargo Services',      category: 'Logistics',        contact: 'Anita Desai',    email: 'anita@fastmove.co.in',   phone: '9745432109', city: 'Ahmedabad',  state: 'Gujarat',     gst: '24AAACF3456P1ZF', rating: 4.2, co: 31, to: 35, del: 4, rq: 14, tq: 17, status: 'active' },
    { companyName: 'BlueLinx Transport',           category: 'Logistics',        contact: 'Vijay Kumar',    email: 'vijay@bluelinx.in',      phone: '9734321098', city: 'Hyderabad', state: 'Telangana',   gst: '36AAACB7890Q2ZG', rating: 4.0, co: 26, to: 30, del: 4, rq: 11, tq: 15, status: 'active' },

    // Consulting
    { companyName: 'Sigma Consulting Group',       category: 'Consulting',       contact: 'Brijesh Malhotra',email:'brijesh@sigmaconsult.com',phone: '9723210987', city: 'Ahmedabad',  state: 'Gujarat',     gst: '24AAACS2345R3ZH', rating: 4.6, co: 16, to: 16, del: 0, rq: 7,  tq: 9,  status: 'active' },
    { companyName: 'ProMinds Advisory',            category: 'Consulting',       contact: 'Rekha Agarwal',  email: 'rekha@prominds.in',      phone: '9712109876', city: 'Jaipur',     state: 'Rajasthan',   gst: '08AAACP6789S4ZI', rating: 4.4, co: 12, to: 13, del: 1, rq: 6,  tq: 8,  status: 'active' },
    { companyName: 'StratEdge Consultants',        category: 'Consulting',       contact: 'Harsh Patel',    email: 'harsh@stratedge.in',     phone: '9701098765', city: 'Vadodara',   state: 'Gujarat',     gst: '24AAACS1234T5ZJ', rating: 4.1, co: 10, to: 12, del: 2, rq: 5,  tq: 7,  status: 'active' },

    // Manufacturing
    { companyName: 'IndoFab Manufacturing',        category: 'Manufacturing',    contact: 'Rakesh Pandey',  email: 'rakesh@indofab.in',      phone: '9689876543', city: 'Coimbatore', state: 'Tamil Nadu',  gst: '33AAACI5678U6ZK', rating: 4.3, co: 36, to: 40, del: 4, rq: 14, tq: 18, status: 'active' },
    { companyName: 'MetalCraft Industries',        category: 'Manufacturing',    contact: 'Geeta Wagh',     email: 'geeta@metalcraft.co.in', phone: '9678765432', city: 'Nagpur',     state: 'Maharashtra', gst: '27AAACM9012V7ZL', rating: 4.0, co: 29, to: 33, del: 4, rq: 11, tq: 15, status: 'active' },
    { companyName: 'Precision Steel Works',        category: 'Manufacturing',    contact: 'Sunil Tiwari',   email: 'sunil@psteelworks.in',   phone: '9667654321', city: 'Pune',       state: 'Maharashtra', gst: '27AAACP3456W8ZM', rating: 3.8, co: 22, to: 28, del: 6, rq: 9,  tq: 13, status: 'active' },

    // Cloud/SaaS
    { companyName: 'CloudAxis Technologies',       category: 'IT & Software',    contact: 'Isha Trivedi',   email: 'isha@cloudaxis.io',      phone: '9656543210', city: 'Bengaluru',  state: 'Karnataka',   gst: '29AAACC7890X9ZN', rating: 4.7, co: 44, to: 46, del: 2, rq: 16, tq: 20, status: 'active' },
    { companyName: 'DataFlow Analytics',           category: 'IT & Software',    contact: 'Nikhil Saxena',  email: 'nikhil@dataflow.ai',     phone: '9645432109', city: 'Noida',      state: 'Uttar Pradesh',gst: '09AAACD2345Y0ZO', rating: 4.5, co: 38, to: 41, del: 3, rq: 14, tq: 18, status: 'active' },

    // Security
    { companyName: 'SecureNet Solutions',          category: 'IT & Software',    contact: 'Farida Sheikh',  email: 'farida@securenet.in',    phone: '9634321098', city: 'Mumbai',     state: 'Maharashtra', gst: '27AAACS6789Z1ZP', rating: 4.3, co: 27, to: 30, del: 3, rq: 10, tq: 14, status: 'active' },

    // Furniture
    { companyName: 'ErgoFurniture Hub',            category: 'Office Supplies',  contact: 'Lalit Chaudhary',email: 'lalit@ergofurniture.in', phone: '9623210987', city: 'Lucknow',    state: 'Uttar Pradesh',gst: '09AAACE1234A2ZQ', rating: 4.4, co: 43, to: 46, del: 3, rq: 15, tq: 19, status: 'active' },

    // Power / Electrical
    { companyName: 'PowerGrid Electricals',        category: 'Hardware',         contact: 'Suresh Yadav',   email: 'suresh@powergrid.co.in', phone: '9612109876', city: 'Chandigarh', state: 'Punjab',      gst: '03AAACP5678B3ZR', rating: 4.1, co: 31, to: 35, del: 4, rq: 12, tq: 16, status: 'active' },

    // HR / Staffing
    { companyName: 'PeopleBridge HR Services',     category: 'Consulting',       contact: 'Nandini Pillai', email: 'nandini@peoplebridge.in',phone: '9601098765', city: 'Bengaluru',  state: 'Karnataka',   gst: '29AAACP9012C4ZS', rating: 4.2, co: 19, to: 22, del: 3, rq: 8,  tq: 11, status: 'active' },

    // Packaging
    { companyName: 'PackWell Packaging Co.',       category: 'Manufacturing',    contact: 'Ravi Krishnan',  email: 'ravi@packwell.in',       phone: '9589876543', city: 'Chennai',    state: 'Tamil Nadu',  gst: '33AAACP3456D5ZT', rating: 3.9, co: 24, to: 29, del: 5, rq: 10, tq: 13, status: 'active' },
  ];

  const vendors = [];
  for (const v of VENDORS_DEF) {
    const doc = await Vendor.create({
      companyName: v.companyName, category: v.category,
      contactName: v.contact, email: v.email, phone: v.phone,
      gstNumber: v.gst, status: v.status, rating: v.rating,
      completedOrders: v.co, totalOrders: v.to,
      delayedOrders: v.del, rejectedQuotations: rnd(0, 3),
      totalQuotations: v.tq,
      address: { city: v.city, state: v.state, country: 'India' },
      notes: `Established vendor in ${v.category}. Verified GST registered.`,
    });
    vendors.push(doc);
  }
  console.log(`🏢 Created ${vendors.length} vendors`);

  // Shorthand vendor refs
  const vIT   = vendors.filter(v => v.category === 'IT & Software');
  const vHW   = vendors.filter(v => v.category === 'Hardware');
  const vOS   = vendors.filter(v => v.category === 'Office Supplies');
  const vLG   = vendors.filter(v => v.category === 'Logistics');
  const vCN   = vendors.filter(v => v.category === 'Consulting');
  const vMF   = vendors.filter(v => v.category === 'Manufacturing');

  // ── 12 RFQs ──────────────────────────────────────────────────────────────
  const RFQ_DEF = [
    {
      title: 'Enterprise Laptops Q3 2026', category: 'IT & Software',
      desc: 'Procurement of 50 high-performance laptops for development team expansion.',
      items: [
        { name: 'Dell XPS 15 Laptop (i7, 32GB, 1TB)', quantity: 30, unit: 'pcs', estimatedPrice: 95000 },
        { name: 'HP ZBook 16 Workstation',             quantity: 20, unit: 'pcs', estimatedPrice: 115000 },
        { name: 'Laptop Bag - Premium',                quantity: 50, unit: 'pcs', estimatedPrice: 2500 },
      ],
      deadline: future(25), vendors: vIT.slice(0,3), status: 'open', createdBy: vatsal,
    },
    {
      title: 'Cloud Infrastructure Services FY2027', category: 'IT & Software',
      desc: 'Annual cloud hosting and managed services contract for production workloads.',
      items: [
        { name: 'AWS Reserved Instances (3yr) - prod cluster', quantity: 12, unit: 'months', estimatedPrice: 85000 },
        { name: 'CDN & Storage Services',                       quantity: 12, unit: 'months', estimatedPrice: 25000 },
        { name: 'DevOps Managed Support',                       quantity: 12, unit: 'months', estimatedPrice: 45000 },
      ],
      deadline: future(40), vendors: [vIT[3], vIT[4]], status: 'open', createdBy: yash,
    },
    {
      title: 'Office Furniture Renovation', category: 'Office Supplies',
      desc: 'Complete office furniture upgrade for 3 floors including ergonomic chairs, desks, and meeting room furniture.',
      items: [
        { name: 'Ergonomic Office Chair - Premium', quantity: 120, unit: 'pcs', estimatedPrice: 12000 },
        { name: 'Height-Adjustable Standing Desk',  quantity: 80,  unit: 'pcs', estimatedPrice: 25000 },
        { name: 'Meeting Room Table (10-seater)',    quantity: 6,   unit: 'pcs', estimatedPrice: 65000 },
        { name: 'Modular Storage Cabinet',           quantity: 40,  unit: 'pcs', estimatedPrice: 8500 },
      ],
      deadline: future(35), vendors: [vOS[0], vOS[1], vOS[3]], status: 'awarded', createdBy: yash,
    },
    {
      title: 'Network Infrastructure Upgrade', category: 'Hardware',
      desc: 'Upgrade of core network infrastructure across all office locations.',
      items: [
        { name: 'Cisco Catalyst 9300 48-port Switch', quantity: 8,  unit: 'pcs', estimatedPrice: 185000 },
        { name: 'Cisco ASA 5506 Firewall',             quantity: 4,  unit: 'pcs', estimatedPrice: 95000 },
        { name: 'Cat6A UTP Cable (305m roll)',         quantity: 20, unit: 'rolls', estimatedPrice: 12000 },
        { name: 'APC UPS 10KVA',                       quantity: 4,  unit: 'pcs', estimatedPrice: 145000 },
      ],
      deadline: future(30), vendors: vHW.slice(0,3), status: 'under_review', createdBy: vatsal,
    },
    {
      title: 'Annual Office Supplies Contract', category: 'Office Supplies',
      desc: 'Yearly contract for all stationery and office consumables.',
      items: [
        { name: 'A4 Paper Ream 80gsm (5-ream bundle)', quantity: 500, unit: 'bundles', estimatedPrice: 1800 },
        { name: 'Printer Ink Cartridge Set (Color)',   quantity: 120, unit: 'sets',    estimatedPrice: 2800 },
        { name: 'Whiteboard Markers Pack',             quantity: 200, unit: 'packs',   estimatedPrice: 350 },
        { name: 'Stapler & Pin Set',                   quantity: 80,  unit: 'sets',    estimatedPrice: 450 },
      ],
      deadline: past(5), vendors: vOS.slice(0,3), status: 'awarded', createdBy: yash,
    },
    {
      title: 'Logistics Partner — Pan India', category: 'Logistics',
      desc: 'Empanelment of logistics partner for pan-India goods movement.',
      items: [
        { name: 'Full Truck Load (FTL) - Monthly',       quantity: 50, unit: 'trips', estimatedPrice: 28000 },
        { name: 'Part Truck Load (PTL) - Monthly',       quantity: 100, unit: 'trips', estimatedPrice: 8000 },
        { name: 'Last-Mile Delivery - Per shipment',     quantity: 500, unit: 'shipments', estimatedPrice: 350 },
      ],
      deadline: past(10), vendors: vLG.slice(0,3), status: 'awarded', createdBy: yash,
    },
    {
      title: 'Digital Transformation Consulting', category: 'Consulting',
      desc: 'Consulting engagement for ERP modernization and process automation.',
      items: [
        { name: 'Business Process Analysis - Phase 1', quantity: 3, unit: 'months', estimatedPrice: 450000 },
        { name: 'Solution Architecture Design',        quantity: 2, unit: 'months', estimatedPrice: 380000 },
        { name: 'Change Management Training',          quantity: 1, unit: 'month',  estimatedPrice: 250000 },
      ],
      deadline: future(60), vendors: vCN.slice(0,3), status: 'open', createdBy: vatsal,
    },
    {
      title: 'Security Systems & CCTV Installation', category: 'Hardware',
      desc: 'Installation of IP CCTV cameras and access control systems across premises.',
      items: [
        { name: 'Hikvision 4K IP Camera (outdoor)', quantity: 40, unit: 'pcs', estimatedPrice: 18000 },
        { name: 'Hikvision 4K IP Camera (indoor)',  quantity: 60, unit: 'pcs', estimatedPrice: 12000 },
        { name: 'NVR 64-Channel 8TB',               quantity: 4,  unit: 'pcs', estimatedPrice: 85000 },
        { name: 'Access Control Biometric Reader',  quantity: 20, unit: 'pcs', estimatedPrice: 22000 },
      ],
      deadline: future(20), vendors: [vHW[2], vIT[5]], status: 'open', createdBy: yash,
    },
    {
      title: 'Manufacturing Equipment Maintenance', category: 'Manufacturing',
      desc: 'Annual maintenance contract for manufacturing floor equipment.',
      items: [
        { name: 'CNC Machine Servicing',             quantity: 12, unit: 'services', estimatedPrice: 35000 },
        { name: 'Hydraulic Press Calibration',       quantity: 12, unit: 'services', estimatedPrice: 18000 },
        { name: 'Preventive Maintenance Package',    quantity: 1,  unit: 'yr',       estimatedPrice: 480000 },
      ],
      deadline: future(45), vendors: vMF.slice(0,3), status: 'open', createdBy: yash,
    },
    {
      title: 'Software Licenses — Microsoft 365', category: 'IT & Software',
      desc: 'Microsoft 365 Business Premium licenses for all employees.',
      items: [
        { name: 'Microsoft 365 Business Premium (Annual)', quantity: 250, unit: 'licenses', estimatedPrice: 16500 },
        { name: 'Azure AD P2 Add-on',                      quantity: 250, unit: 'licenses', estimatedPrice: 4500 },
      ],
      deadline: past(15), vendors: vIT.slice(0,2), status: 'awarded', createdBy: vatsal,
    },
    {
      title: 'Cafeteria Supplies & Equipment', category: 'Office Supplies',
      desc: 'Monthly supply contract for cafeteria consumables and kitchen equipment.',
      items: [
        { name: 'Commercial Microwave Oven',     quantity: 4,  unit: 'pcs',     estimatedPrice: 28000 },
        { name: 'Paper Cups & Plates (bulk)',    quantity: 100, unit: 'cartons', estimatedPrice: 1200 },
        { name: 'Tea & Coffee Vending Machine',  quantity: 2,  unit: 'pcs',     estimatedPrice: 85000 },
        { name: 'Drinking Water Dispenser',      quantity: 10, unit: 'pcs',     estimatedPrice: 12000 },
      ],
      deadline: past(3), vendors: [vOS[0], vOS[2]], status: 'under_review', createdBy: yash,
    },
    {
      title: 'HR Training & Development Platform', category: 'Consulting',
      desc: 'Annual subscription to e-learning platform with custom training modules.',
      items: [
        { name: 'LMS Platform License (Annual)',      quantity: 500, unit: 'users',  estimatedPrice: 3500 },
        { name: 'Custom Content Development (hrs)',   quantity: 200, unit: 'hours',  estimatedPrice: 4500 },
        { name: 'Admin & Support Package',            quantity: 1,   unit: 'yr',     estimatedPrice: 150000 },
      ],
      deadline: past(20), vendors: [vCN[0], vCN[2]], status: 'awarded', createdBy: prince,
    },
  ];

  const rfqs = [];
  for (let i = 0; i < RFQ_DEF.length; i++) {
    const r = RFQ_DEF[i];
    const num = String(i + 1).padStart(4, '0');
    const doc = await RFQ.create({
      rfqNumber: `RFQ-2026-${num}`,
      title: r.title, description: r.desc,
      items: r.items,
      deadline: r.deadline,
      assignedVendors: r.vendors.map(v => v._id),
      status: r.status,
      createdBy: r.createdBy._id,
    });
    rfqs.push(doc);
  }
  console.log(`📋 Created ${rfqs.length} RFQs`);

  // ── QUOTATIONS ────────────────────────────────────────────────────────────
  // Helper: create a quotation matching an RFQ's items with variation
  const makeQuotItems = (rfqItems, multiplier) =>
    rfqItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: Math.round(item.estimatedPrice * multiplier),
      totalPrice: Math.round(item.quantity * item.estimatedPrice * multiplier),
    }));

  const quotationDefs = [
    // RFQ 0: Enterprise Laptops — 3 quotations
    { rfq: rfqs[0], vendor: vIT[0], mult: 1.02, delivery: 7,  notes: '3-year warranty, onsite support included.',        status: 'submitted' },
    { rfq: rfqs[0], vendor: vIT[1], mult: 0.96, delivery: 14, notes: 'Bulk discount applied. COD available.',             status: 'submitted' },
    { rfq: rfqs[0], vendor: vIT[3], mult: 1.08, delivery: 5,  notes: 'Premium config, next-day replacement guarantee.',   status: 'under_review' },

    // RFQ 1: Cloud Infrastructure — 3 quotations
    { rfq: rfqs[1], vendor: vIT[3], mult: 0.94, delivery: 1,  notes: 'Uptime SLA 99.99%. Includes free migration.',       status: 'submitted' },
    { rfq: rfqs[1], vendor: vIT[4], mult: 1.05, delivery: 1,  notes: 'Dedicated account manager assigned.',               status: 'submitted' },
    { rfq: rfqs[1], vendor: vIT[0], mult: 1.00, delivery: 1,  notes: 'ISO 27001 certified. 24/7 NOC support.',            status: 'submitted' },

    // RFQ 2: Office Furniture — 4 quotations (awarded)
    { rfq: rfqs[2], vendor: vOS[0], mult: 0.98, delivery: 21, notes: 'ISI marked. 5-year warranty on chairs.',            status: 'accepted' },
    { rfq: rfqs[2], vendor: vOS[1], mult: 0.92, delivery: 28, notes: 'Lowest price. Delivery in phases.',                 status: 'rejected'  },
    { rfq: rfqs[2], vendor: vOS[3], mult: 1.06, delivery: 14, notes: 'Premium quality. Fast delivery, branded items.',    status: 'submitted' },
    { rfq: rfqs[2], vendor: vOS[2], mult: 1.12, delivery: 10, notes: 'Ergonomic certified. Same-week installation.',      status: 'submitted' },

    // RFQ 3: Network Infrastructure — 3 quotations
    { rfq: rfqs[3], vendor: vHW[0], mult: 1.04, delivery: 14, notes: 'Cisco authorized reseller. Includes configuration.', status: 'under_review' },
    { rfq: rfqs[3], vendor: vHW[1], mult: 0.97, delivery: 20, notes: 'Competitive price. Installation extra.',              status: 'submitted' },
    { rfq: rfqs[3], vendor: vHW[2], mult: 1.01, delivery: 16, notes: 'All items in stock. Free site survey.',               status: 'submitted' },

    // RFQ 4: Office Supplies Annual — 3 quotations (awarded)
    { rfq: rfqs[4], vendor: vOS[0], mult: 0.95, delivery: 3,  notes: 'Monthly auto-replenishment service.',               status: 'accepted' },
    { rfq: rfqs[4], vendor: vOS[1], mult: 1.02, delivery: 5,  notes: 'Brand-name products only.',                         status: 'rejected' },
    { rfq: rfqs[4], vendor: vOS[2], mult: 0.90, delivery: 4,  notes: 'Lowest quote. Quality comparable.',                  status: 'submitted' },

    // RFQ 5: Logistics — 3 quotations (awarded)
    { rfq: rfqs[5], vendor: vLG[0], mult: 1.03, delivery: 1,  notes: 'GPS tracking on all shipments.',                   status: 'accepted' },
    { rfq: rfqs[5], vendor: vLG[1], mult: 0.98, delivery: 1,  notes: 'Pan-India network, same-day booking.',              status: 'submitted' },
    { rfq: rfqs[5], vendor: vLG[2], mult: 0.94, delivery: 1,  notes: 'Price is lowest but limited to 8 states.',          status: 'rejected' },

    // RFQ 6: Consulting — 2 quotations
    { rfq: rfqs[6], vendor: vCN[0], mult: 1.10, delivery: 5,  notes: 'Top-tier consultants. Previous ERP experience.',    status: 'submitted' },
    { rfq: rfqs[6], vendor: vCN[1], mult: 0.92, delivery: 7,  notes: 'Cost-effective. Agile methodology.',                status: 'submitted' },

    // RFQ 7: Security Systems — 3 quotations
    { rfq: rfqs[7], vendor: vHW[0], mult: 0.99, delivery: 25, notes: 'AMC included for 2 years.',                         status: 'submitted' },
    { rfq: rfqs[7], vendor: vHW[2], mult: 1.05, delivery: 20, notes: 'Includes cloud NVR subscription.',                  status: 'submitted' },
    { rfq: rfqs[7], vendor: vIT[5], mult: 1.02, delivery: 18, notes: 'Smart AI-based detection cameras.',                 status: 'under_review' },

    // RFQ 8: Manufacturing Maintenance — 2 quotations
    { rfq: rfqs[8], vendor: vMF[0], mult: 0.97, delivery: 3,  notes: 'OEM certified engineers.',                          status: 'submitted' },
    { rfq: rfqs[8], vendor: vMF[1], mult: 1.04, delivery: 2,  notes: 'Faster response SLA of 4 hours.',                  status: 'submitted' },

    // RFQ 9: Microsoft Licenses — 2 quotations (awarded)
    { rfq: rfqs[9], vendor: vIT[0], mult: 1.00, delivery: 1,  notes: 'Microsoft CSP partner. Instant provisioning.',      status: 'accepted' },
    { rfq: rfqs[9], vendor: vIT[4], mult: 1.02, delivery: 2,  notes: 'Includes IT admin training.',                       status: 'rejected' },

    // RFQ 10: Cafeteria — 3 quotations
    { rfq: rfqs[10], vendor: vOS[0], mult: 0.96, delivery: 7,  notes: 'FSSAI certified kitchen equipment.',               status: 'under_review' },
    { rfq: rfqs[10], vendor: vOS[2], mult: 1.03, delivery: 5,  notes: 'Branded equipment with 2yr warranty.',             status: 'submitted' },
    { rfq: rfqs[10], vendor: vOS[1], mult: 0.90, delivery: 10, notes: 'Budget option. No warranty on consumables.',       status: 'submitted' },

    // RFQ 11: HR Training — 2 quotations (awarded)
    { rfq: rfqs[11], vendor: vCN[0], mult: 1.05, delivery: 7, notes: 'Coursera partnership. 500+ courses.',               status: 'accepted' },
    { rfq: rfqs[11], vendor: vCN[2], mult: 0.95, delivery: 5, notes: 'Custom modules in 15 days.',                        status: 'rejected' },
  ];

  const quotations = [];
  for (const qd of quotationDefs) {
    const items = makeQuotItems(qd.rfq.items, qd.mult);
    const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);
    const gstRate = 18;
    const gst = Math.round(subtotal * gstRate / 100);
    const doc = await Quotation.create({
      rfqId:       qd.rfq._id,
      vendorId:    qd.vendor._id,
      items,
      subtotal,
      gstRate,
      gstAmount:   gst,
      totalPrice:  subtotal + gst,
      deliveryDays:qd.delivery,
      notes:       qd.notes,
      status:      qd.status,
      submittedAt: past(rnd(1, 30)),
      rejectionReason: qd.status === 'rejected' ? 'Does not meet budget or quality requirements.' : undefined,
    });
    quotations.push(doc);
  }
  console.log(`📄 Created ${quotations.length} quotations`);

  // ── PURCHASE ORDERS ───────────────────────────────────────────────────────
  const acceptedQuotations = quotations.filter(q => q.status === 'accepted');
  const pos = [];
  const poStatuses = ['confirmed', 'delivered', 'pending'];

  for (let i = 0; i < acceptedQuotations.length; i++) {
    const q      = acceptedQuotations[i];
    const rfq    = rfqs.find(r => r._id.toString() === q.rfqId.toString());
    const subtot = Math.round(q.totalPrice / 1.18); // back-calc subtotal from total (18% GST)

    const status = poStatuses[i % poStatuses.length];
    const po = await PurchaseOrder.create({
      rfqId:       q.rfqId,
      quotationId: q._id,
      vendorId:    q.vendorId,
      createdBy:   vatsal._id,
      items:       q.items,
      subtotal:    subtot,
      taxRate:     18,
      status,
      deliveryDate: future(rnd(7, 30)),
      notes:       rfq ? `Raised for: ${rfq.title}` : 'Standard Purchase Order',
    });
    pos.push(po);
  }
  console.log(`🛒 Created ${pos.length} purchase orders`);

  // ── INVOICES ──────────────────────────────────────────────────────────────
  const invoiceStatuses = ['paid', 'sent', 'draft', 'overdue'];
  const invs = [];

  for (let i = 0; i < pos.length; i++) {
    const po    = pos[i];
    const issue = past(rnd(5, 30));
    const due   = new Date(issue); due.setDate(due.getDate() + 30);
    const status= invoiceStatuses[i % invoiceStatuses.length];

    const inv = await Invoice.create({
      poId:      po._id,
      vendorId:  po.vendorId,
      createdBy: vatsal._id,
      items:     po.items,
      subtotal:  po.subtotal,
      gstRate:   18,
      issueDate: issue,
      dueDate:   due,
      status,
      notes: status === 'overdue'
        ? 'Payment is overdue. Please remit amount at the earliest.'
        : 'Thank you for your business with VendorBridge AI.',
    });
    invs.push(inv);
  }
  console.log(`🧾 Created ${invs.length} invoices`);


  // ── SUMMARY ───────────────────────────────────────────────────────────────
  console.log('\n✅ ═══════════════════════════════════════════════════════');
  console.log('   SEED COMPLETE — VendorBridge AI Database');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`   Users:          ${users.length}`);
  console.log(`   Vendors:        ${vendors.length}`);
  console.log(`   RFQs:           ${rfqs.length}`);
  console.log(`   Quotations:     ${quotations.length}`);
  console.log(`   Purchase Orders:${pos.length}`);
  console.log(`   Invoices:       ${invs.length}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n🔑 Login Credentials:');
  USERS_DEF.forEach(u => console.log(`   ${u.role.padEnd(22)} ${u.username}@gmail.com / ${u.username}123`));
  console.log('');

  await mongoose.disconnect();
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
