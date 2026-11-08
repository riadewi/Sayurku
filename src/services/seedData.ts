import { doc, writeBatch, collection, getDocs, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, Supplier, Category, BundleComponent } from '../types';
import { initialVegetableCatalog } from './catalogData';
import { getVerifiedProductImage } from './verifiedImages';

export async function seedInitialVegetableData(businessId: string, userId: string): Promise<void> {
  try {
    const batch = writeBatch(db);

    // 1. Categories
    const categories = [
      { name: 'Sayuran Daun', icon: 'Leaf' },
      { name: 'Sayuran Umbi & Buah', icon: 'Carrot' },
      { name: 'Bumbu & Rempah', icon: 'Flame' },
      { name: 'Paket Bundling Sayur', icon: 'Package' }
    ];

    for (const cat of categories) {
      const catRef = doc(collection(db, 'categories'));
      const catData: Category = {
        id: catRef.id,
        businessId,
        name: cat.name,
        icon: cat.icon,
        createdAt: new Date().toISOString()
      };
      batch.set(catRef, catData);
    }

    // 2. Suppliers
    const suppliers = [
      { name: 'Kelompok Tani Sayur Lembang', phone: '0813-2211-4455', address: 'Jl. Raya Maribaya No. 45, Lembang' },
      { name: 'Grosir Sayur Induk Kramat Jati', phone: '0812-9988-7766', address: 'Los Sayuran Segar Blok C-08' },
      { name: 'Pemasok Bumbu Berkah Brebes', phone: '0857-1122-3344', address: 'Kavling Palawija No. 12' }
    ];

    for (const sup of suppliers) {
      const supRef = doc(collection(db, 'suppliers'));
      const supData: Supplier = {
        id: supRef.id,
        businessId,
        name: sup.name,
        phone: sup.phone,
        address: sup.address,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      batch.set(supRef, supData);
    }

    // 3. Single Products
    const nowIso = new Date().toISOString();

    const wortelId = doc(collection(db, 'products')).id;
    const kentangId = doc(collection(db, 'products')).id;
    const kolId = doc(collection(db, 'products')).id;
    const daunBawangId = doc(collection(db, 'products')).id;
    const seledriId = doc(collection(db, 'products')).id;
    const kangkungId = doc(collection(db, 'products')).id;
    const bayamId = doc(collection(db, 'products')).id;
    const tomatId = doc(collection(db, 'products')).id;
    const cabaiId = doc(collection(db, 'products')).id;
    const jagungId = doc(collection(db, 'products')).id;
    const labuId = doc(collection(db, 'products')).id;
    const bawangMerahId = doc(collection(db, 'products')).id;
    const bawangPutihId = doc(collection(db, 'products')).id;

    const singleProducts: Product[] = [
      {
        id: wortelId,
        businessId,
        name: 'Wortel Brastagi Segar',
        category: 'Sayuran Umbi & Buah',
        type: 'SINGLE',
        baseUnit: 'Buah',
        purchaseCost: 1200,
        sellingPrice: 2000,
        currentStock: 65,
        minStock: 15,
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        id: kentangId,
        businessId,
        name: 'Kentang Dieng Super',
        category: 'Sayuran Umbi & Buah',
        type: 'SINGLE',
        baseUnit: 'Buah',
        purchaseCost: 2200,
        sellingPrice: 3500,
        currentStock: 50,
        minStock: 10,
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        id: kolId,
        businessId,
        name: 'Kol / Kubis Putih',
        category: 'Sayuran Daun',
        type: 'SINGLE',
        baseUnit: 'Gram',
        purchaseCost: 9, // Rp 9.000 / kg
        sellingPrice: 15, // Rp 15.000 / kg
        currentStock: 6000,
        minStock: 1000,
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        id: daunBawangId,
        businessId,
        name: 'Daun Bawang Segar',
        category: 'Sayuran Daun',
        type: 'SINGLE',
        baseUnit: 'Buah',
        purchaseCost: 800,
        sellingPrice: 1500,
        currentStock: 40,
        minStock: 10,
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        id: seledriId,
        businessId,
        name: 'Daun Seledri Wangi',
        category: 'Sayuran Daun',
        type: 'SINGLE',
        baseUnit: 'Buah',
        purchaseCost: 500,
        sellingPrice: 1000,
        currentStock: 35,
        minStock: 8,
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        id: bayamId,
        businessId,
        name: 'Bayam Hijau Petik',
        category: 'Sayuran Daun',
        type: 'SINGLE',
        baseUnit: 'Ikat',
        purchaseCost: 2000,
        sellingPrice: 3500,
        currentStock: 30,
        minStock: 10,
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        id: kangkungId,
        businessId,
        name: 'Kangkung Lombok Segar',
        category: 'Sayuran Daun',
        type: 'SINGLE',
        baseUnit: 'Ikat',
        purchaseCost: 1800,
        sellingPrice: 3000,
        currentStock: 45,
        minStock: 10,
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        id: tomatId,
        businessId,
        name: 'Tomat Merah Segar',
        category: 'Sayuran Umbi & Buah',
        type: 'SINGLE',
        baseUnit: 'Buah',
        purchaseCost: 1000,
        sellingPrice: 1800,
        currentStock: 50,
        minStock: 15,
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        id: cabaiId,
        businessId,
        name: 'Cabai Rawit Merah Pedas',
        category: 'Bumbu & Rempah',
        type: 'SINGLE',
        baseUnit: 'Gram',
        purchaseCost: 55, // Rp 55.000 / kg
        sellingPrice: 85, // Rp 85.000 / kg
        currentStock: 3500,
        minStock: 500,
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        id: jagungId,
        businessId,
        name: 'Jagung Manis Madu',
        category: 'Sayuran Umbi & Buah',
        type: 'SINGLE',
        baseUnit: 'Buah',
        purchaseCost: 2800,
        sellingPrice: 4500,
        currentStock: 25,
        minStock: 8,
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        id: labuId,
        businessId,
        name: 'Labu Siam Muda',
        category: 'Sayuran Umbi & Buah',
        type: 'SINGLE',
        baseUnit: 'Buah',
        purchaseCost: 1800,
        sellingPrice: 3000,
        currentStock: 20,
        minStock: 5,
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        id: bawangMerahId,
        businessId,
        name: 'Bawang Merah Brebes',
        category: 'Bumbu & Rempah',
        type: 'SINGLE',
        baseUnit: 'Gram',
        purchaseCost: 40,
        sellingPrice: 65,
        currentStock: 4000,
        minStock: 800,
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        id: bawangPutihId,
        businessId,
        name: 'Bawang Putih Kating',
        category: 'Bumbu & Rempah',
        type: 'SINGLE',
        baseUnit: 'Gram',
        purchaseCost: 35,
        sellingPrice: 55,
        currentStock: 4000,
        minStock: 800,
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso
      }
    ];

    for (const prod of singleProducts) {
      const verified = getVerifiedProductImage(prod.name);
      if (verified) {
        prod.imageUrl = verified.imageUrl;
        prod.imageAlt = verified.imageAlt;
        prod.imageUpdatedAt = nowIso;
      }
      batch.set(doc(db, 'products', prod.id), prod);
    }

    // 4. Bundle Products
    const bundleSopId = doc(collection(db, 'products')).id;
    const bundleTumisId = doc(collection(db, 'products')).id;
    const bundleAsemId = doc(collection(db, 'products')).id;

    // Bundle 1: Paket Sayur Sop
    // 2 Wortel, 2 Kentang, 150g Kol, 1 Daun Bawang, 1 Seledri
    const bundleSopHpp = (2 * 1200) + (2 * 2200) + (150 * 9) + (1 * 800) + (1 * 500); // 2400 + 4400 + 1350 + 800 + 500 = 9450
    const sopVerified = getVerifiedProductImage('paket sayur sop');
    const bundleSop: Product = {
      id: bundleSopId,
      businessId,
      name: 'Paket Sayur Sop Komplit',
      category: 'Paket Bundling Sayur',
      type: 'BUNDLE',
      baseUnit: 'Paket',
      purchaseCost: bundleSopHpp,
      sellingPrice: 14000,
      currentStock: 0, // dynamic
      minStock: 5,
      imageUrl: sopVerified?.imageUrl,
      imageAlt: sopVerified?.imageAlt || 'Paket Sayur Sop',
      isActive: true,
      bundleItems: [
        { productId: wortelId, productName: 'Wortel Brastagi Segar', quantity: 2, unit: 'Buah' },
        { productId: kentangId, productName: 'Kentang Dieng Super', quantity: 2, unit: 'Buah' },
        { productId: kolId, productName: 'Kol / Kubis Putih', quantity: 150, unit: 'Gram' },
        { productId: daunBawangId, productName: 'Daun Bawang Segar', quantity: 1, unit: 'Buah' },
        { productId: seledriId, productName: 'Daun Seledri Wangi', quantity: 1, unit: 'Buah' }
      ],
      createdAt: nowIso,
      updatedAt: nowIso
    };
    batch.set(doc(db, 'products', bundleSopId), bundleSop);

    // Bundle 2: Paket Sayur Asem
    // 1 Jagung, 1 Labu Siam, 1 Tomat, 40g Cabai Rawit
    const bundleAsemHpp = (1 * 2800) + (1 * 1800) + (1 * 1000) + (40 * 55); // 2800 + 1800 + 1000 + 2200 = 7800
    const asemVerified = getVerifiedProductImage('paket sayur asem');
    const bundleAsem: Product = {
      id: bundleAsemId,
      businessId,
      name: 'Paket Sayur Asem Segar',
      category: 'Paket Bundling Sayur',
      type: 'BUNDLE',
      baseUnit: 'Paket',
      purchaseCost: bundleAsemHpp,
      sellingPrice: 12500,
      currentStock: 0,
      minStock: 5,
      imageUrl: asemVerified?.imageUrl,
      imageAlt: asemVerified?.imageAlt || 'Paket Sayur Asem',
      isActive: true,
      bundleItems: [
        { productId: jagungId, productName: 'Jagung Manis Madu', quantity: 1, unit: 'Buah' },
        { productId: labuId, productName: 'Labu Siam Muda', quantity: 1, unit: 'Buah' },
        { productId: tomatId, productName: 'Tomat Merah Segar', quantity: 1, unit: 'Buah' },
        { productId: cabaiId, productName: 'Cabai Rawit Merah Pedas', quantity: 40, unit: 'Gram' }
      ],
      createdAt: nowIso,
      updatedAt: nowIso
    };
    batch.set(doc(db, 'products', bundleAsemId), bundleAsem);

    // Bundle 3: Paket Tumis Kangkung Pedas
    // 2 Ikat Kangkung, 30g Cabai Rawit, 30g Bawang Merah, 20g Bawang Putih
    const bundleTumisHpp = (2 * 1800) + (30 * 55) + (30 * 40) + (20 * 35); // 3600 + 1650 + 1200 + 700 = 7150
    const tumisVerified = getVerifiedProductImage('paket sayur tumis');
    const bundleTumis: Product = {
      id: bundleTumisId,
      businessId,
      name: 'Paket Tumis Kangkung Spesial',
      category: 'Paket Bundling Sayur',
      type: 'BUNDLE',
      baseUnit: 'Paket',
      purchaseCost: bundleTumisHpp,
      sellingPrice: 11000,
      currentStock: 0,
      minStock: 5,
      imageUrl: tumisVerified?.imageUrl,
      imageAlt: tumisVerified?.imageAlt || 'Paket Tumis Kangkung',
      isActive: true,
      bundleItems: [
        { productId: kangkungId, productName: 'Kangkung Lombok Segar', quantity: 2, unit: 'Ikat' },
        { productId: cabaiId, productName: 'Cabai Rawit Merah Pedas', quantity: 30, unit: 'Gram' },
        { productId: bawangMerahId, productName: 'Bawang Merah Brebes', quantity: 30, unit: 'Gram' },
        { productId: bawangPutihId, productName: 'Bawang Putih Kating', quantity: 20, unit: 'Gram' }
      ],
      createdAt: nowIso,
      updatedAt: nowIso
    };
    batch.set(doc(db, 'products', bundleTumisId), bundleTumis);

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'products');
  }
}

/**
 * Seeds the full 78-product vegetable catalog with the 4 required categories:
 * 1. Sayuran Daun (18 products)
 * 2. Sayuran Umbi dan Buah (25 products)
 * 3. Bumbu dan Rempah (20 products)
 * 4. Paket Bundling Sayur (15 recipes)
 */
export async function seedFullVegetableCatalog(businessId: string): Promise<{ count: number }> {
  try {
    const nowIso = new Date().toISOString();

    // 1. Ensure the 4 main categories exist
    const standardCategories = [
      { name: 'Sayuran Daun', icon: 'Leaf' },
      { name: 'Sayuran Umbi dan Buah', icon: 'Carrot' },
      { name: 'Bumbu dan Rempah', icon: 'Flame' },
      { name: 'Paket Bundling Sayur', icon: 'Package' }
    ];

    const catBatch = writeBatch(db);
    for (const cat of standardCategories) {
      const catRef = doc(collection(db, 'categories'));
      catBatch.set(catRef, {
        id: catRef.id,
        businessId,
        name: cat.name,
        icon: cat.icon,
        createdAt: nowIso
      });
    }
    await catBatch.commit();

    // 2. Map single products so bundle products can reference real product IDs
    const singleProductMap = new Map<string, string>();
    const prodBatch = writeBatch(db);

    // First pass: create IDs for single products
    for (const item of initialVegetableCatalog) {
      if (item.type === 'SINGLE') {
        const prodRef = doc(collection(db, 'products'));
        singleProductMap.set(item.name.toLowerCase(), prodRef.id);
        const verified = getVerifiedProductImage(item.name);
        
        const newProd: Product = {
          id: prodRef.id,
          businessId,
          name: item.name,
          category: item.category,
          type: item.type,
          baseUnit: item.baseUnit,
          sellingUnit: item.baseUnit,
          unitConversion: 1,
          purchaseCost: item.purchaseCost,
          sellingPrice: item.sellingPrice,
          currentStock: item.currentStock,
          minStock: item.minStock,
          description: item.description,
          imageUrl: verified?.imageUrl || item.imageUrl,
          imageAlt: verified?.imageAlt || item.imageAlt,
          imageUpdatedAt: nowIso,
          isActive: true,
          createdAt: nowIso,
          updatedAt: nowIso
        };
        prodBatch.set(prodRef, newProd);
      }
    }

    // Second pass: bundle products with resolved components
    for (const item of initialVegetableCatalog) {
      if (item.type === 'BUNDLE') {
        const prodRef = doc(collection(db, 'products'));
        const verified = getVerifiedProductImage(item.name);
        
        // Resolve components
        const resolvedComponents: BundleComponent[] = [];
        if (item.bundleItemDefs) {
          for (const compDef of item.bundleItemDefs) {
            const compId = singleProductMap.get(compDef.productName.toLowerCase()) || doc(collection(db, 'products')).id;
            resolvedComponents.push({
              productId: compId,
              productName: compDef.productName,
              quantity: compDef.quantity,
              unit: compDef.unit
            });
          }
        }

        const newProd: Product = {
          id: prodRef.id,
          businessId,
          name: item.name,
          category: item.category,
          type: item.type,
          baseUnit: item.baseUnit,
          sellingUnit: item.baseUnit,
          unitConversion: 1,
          purchaseCost: item.purchaseCost,
          sellingPrice: item.sellingPrice,
          currentStock: 0, // Bundles calculate dynamically from component inventory
          minStock: item.minStock,
          description: item.description,
          imageUrl: verified?.imageUrl || item.imageUrl,
          imageAlt: verified?.imageAlt || item.imageAlt,
          imageUpdatedAt: nowIso,
          bundleItems: resolvedComponents,
          isActive: true,
          createdAt: nowIso,
          updatedAt: nowIso
        };
        prodBatch.set(prodRef, newProd);
      }
    }

    await prodBatch.commit();
    return { count: initialVegetableCatalog.length };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'products');
    throw error;
  }
}

