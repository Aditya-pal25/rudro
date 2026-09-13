const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
dotenv.config();
const connectDB = require('../config/db');
const User    = require('../models/User');
const Product = require('../models/Product');
const Coupon  = require('../models/Coupon');

const products = [
  { name:'Rudroham Classic Black', description:'The definitive black tee. 100% premium combed cotton, pre-shrunk for a perfect fit.', shortDescription:'Premium combed cotton classic black tee', price:999, discountPrice:799, category:'Essential', gender:'Unisex', fabric:'100% Cotton', fit:'Regular', images:[{url:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',alt:'Black Tee'}], colors:[{name:'Black',hex:'#000000',images:[],sizes:[{size:'S',stock:50},{size:'M',stock:80},{size:'L',stock:60},{size:'XL',stock:40},{size:'XXL',stock:20}]}], isFeatured:true, isBestSeller:true, isNewArrival:false, tags:['classic','essential'], careInstructions:['Machine wash cold','Tumble dry low'] },
  { name:'Rudroham Flame Oversized', description:'Statement oversized tee with flame graphic. Drop-shoulder, 280gsm cotton.', shortDescription:'Oversized flame graphic tee', price:1499, discountPrice:1199, category:'Oversized', gender:'Unisex', fabric:'100% Cotton', fit:'Oversized', images:[{url:'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=800',alt:'Flame Tee'}], colors:[{name:'Washed Black',hex:'#1a1a1a',images:[],sizes:[{size:'S',stock:30},{size:'M',stock:50},{size:'L',stock:40},{size:'XL',stock:25}]},{name:'Vintage White',hex:'#f5f0e8',images:[],sizes:[{size:'S',stock:25},{size:'M',stock:35},{size:'L',stock:30}]}], isFeatured:true, isBestSeller:true, isNewArrival:true, tags:['graphic','oversized','streetwear'], careInstructions:['Hand wash preferred','Cold water only'] },
  { name:'Rudroham Drop Shoulder', description:'Relaxed drop-shoulder silhouette for modern streetwear. Ultra-soft cotton blend.', shortDescription:'Drop shoulder streetwear tee', price:1299, discountPrice:999, category:'Drop Shoulder', gender:'Unisex', fabric:'Cotton Blend', fit:'Relaxed', images:[{url:'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800',alt:'Drop Shoulder'}], colors:[{name:'Sage Green',hex:'#8fae88',images:[],sizes:[{size:'S',stock:20},{size:'M',stock:35},{size:'L',stock:28}]},{name:'Navy',hex:'#1a2744',images:[],sizes:[{size:'M',stock:40},{size:'L',stock:35},{size:'XL',stock:20}]}], isFeatured:true, isNewArrival:true, tags:['drop shoulder','streetwear'], careInstructions:['Machine wash cold'] },
  { name:'Rudroham Vintage Graphic', description:'Distressed vintage graphic tee. Acid-washed for unique character.', shortDescription:'Acid wash vintage graphic tee', price:1599, discountPrice:1299, category:'Vintage', gender:'Unisex', fabric:'100% Cotton', fit:'Regular', images:[{url:'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',alt:'Vintage Tee'}], colors:[{name:'Acid Blue',hex:'#5b7ea6',images:[],sizes:[{size:'S',stock:15},{size:'M',stock:25},{size:'L',stock:20}]}], isFeatured:false, isNewArrival:true, tags:['vintage','acid wash'], careInstructions:['Hand wash cold','Air dry only'] },
  { name:'Rudroham Slim Essential', description:'Tailored slim fit in ultra-soft Pima cotton.', shortDescription:'Slim fit Pima cotton essential', price:1099, discountPrice:899, category:'Slim Fit', gender:'Men', fabric:'100% Cotton', fit:'Slim', images:[{url:'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800',alt:'Slim Fit'}], colors:[{name:'White',hex:'#ffffff',images:[],sizes:[{size:'S',stock:40},{size:'M',stock:60},{size:'L',stock:50}]},{name:'Charcoal',hex:'#3c3c3c',images:[],sizes:[{size:'S',stock:35},{size:'M',stock:55},{size:'L',stock:45}]}], isFeatured:false, isBestSeller:true, isNewArrival:false, tags:['slim fit','essential'], careInstructions:['Machine wash cold'] },
  { name:'Rudroham Polo Heritage', description:'Premium polo with horn buttons. 220gsm Piqué cotton.', shortDescription:'Heritage polo in Piqué cotton', price:1799, discountPrice:1499, category:'Polo', gender:'Men', fabric:'100% Cotton', fit:'Regular', images:[{url:'https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=800',alt:'Polo'}], colors:[{name:'Classic Navy',hex:'#1a2744',images:[],sizes:[{size:'S',stock:20},{size:'M',stock:35},{size:'L',stock:30}]}], isFeatured:true, isNewArrival:false, tags:['polo','premium'], careInstructions:['Machine wash cold'] },
  { name:'Rudroham Crop Street', description:'Boxy crop tee with raw hem finish.', shortDescription:'Boxy crop tee', price:999, discountPrice:799, category:'Crop', gender:'Women', fabric:'100% Cotton', fit:'Relaxed', images:[{url:'https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?w=800',alt:'Crop Tee'}], colors:[{name:'Black',hex:'#000000',images:[],sizes:[{size:'XS',stock:25},{size:'S',stock:40},{size:'M',stock:35}]}], isNewArrival:true, tags:['crop','women'], careInstructions:['Machine wash cold'] },
  { name:'Rudroham Organic Everyday', description:'GOTS-certified organic cotton. Gentle on skin, kind to the planet.', shortDescription:'Organic cotton everyday tee', price:1199, discountPrice:999, category:'Essential', gender:'Unisex', fabric:'Organic Cotton', fit:'Regular', images:[{url:'https://images.unsplash.com/photo-1627225793904-a711b20441b8?w=800',alt:'Organic Tee'}], colors:[{name:'Natural White',hex:'#faf7f2',images:[],sizes:[{size:'S',stock:30},{size:'M',stock:50},{size:'L',stock:40}]}], isNewArrival:true, tags:['organic','sustainable'], careInstructions:['Machine wash warm'] },
];

const coupons = [
  { code:'WELCOME20', description:'20% off first order', type:'percentage', value:20, minOrderAmount:500, maxDiscount:300, perUserLimit:1, endDate:new Date('2026-12-31') },
  { code:'RUDROHAM100', description:'₹100 off orders above ₹799', type:'fixed', value:100, minOrderAmount:799, endDate:new Date('2026-12-31') },
  { code:'SAVE15', description:'15% off orders above ₹1499', type:'percentage', value:15, minOrderAmount:1499, maxDiscount:500, endDate:new Date('2026-12-31') },
];

const seed = async () => {
  await connectDB();
  try {
    await Product.deleteMany(); await Coupon.deleteMany();
    const adminEmail    = process.env.ADMIN_EMAIL    || 'admin@rudroham.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({ name:'Rudroham Admin', email:adminEmail, password:adminPassword, role:'admin', emailVerified:true });
      console.log('✅ Admin created:', adminEmail);
    } else {
      admin.role='admin';
      admin.emailVerified=true;
      admin.password=adminPassword;
      await admin.save({ validateBeforeSave:false });
      console.log('✅ Admin updated:', adminEmail);
    }
    await Product.insertMany(products); console.log(`✅ ${products.length} products seeded`);
    await Coupon.insertMany(coupons);   console.log(`✅ ${coupons.length} coupons seeded`);
    console.log('\n🎉 Rudroham database ready!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Admin Email:    ', adminEmail);
    console.log('  Admin Password: ', adminPassword);
    console.log('  Admin Panel:     http://localhost:5174/login');
    console.log('  Customer Store:  http://localhost:5173');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
  } catch(err) { console.error('❌ Seed error:', err.message); process.exit(1); }
};
seed();
