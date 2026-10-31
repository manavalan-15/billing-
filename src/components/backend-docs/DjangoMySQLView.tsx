import React, { useState } from 'react';
import { Database, Code2, Copy, Check, Download, Layers, Server } from 'lucide-react';

export const DjangoMySQLView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<'models' | 'serializers' | 'views' | 'urls' | 'schema'>('models');
  const [copied, setCopied] = useState(false);

  const fileContents = {
    models: `"""
Men's Wear Shop POS & Inventory Management System
Django Models (Python Django + MySQL ORM)
Database: MySQL 8.0+
"""

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('cashier', 'Cashier'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='cashier')
    pin = models.CharField(max_length=4, help_text="4-digit cashier login PIN")
    phone = models.CharField(max_length=20, blank=True)

    class Meta:
        db_table = 'pos_users'


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'pos_categories'
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class Brand(models.Model):
    name = models.CharField(max_length=100, unique=True)
    origin = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'pos_brands'

    def __str__(self):
        return self.name


class Supplier(models.Model):
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    gstin = models.CharField(max_length=20, blank=True)
    outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    class Meta:
        db_table = 'pos_suppliers'

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=50, unique=True, db_index=True)
    barcode = models.CharField(max_length=50, unique=True, db_index=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='products')
    brand = models.ForeignKey(Brand, on_delete=models.PROTECT, related_name='products')
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    mrp = models.DecimalField(max_digits=10, decimal_places=2)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=12.00)
    description = models.TextField(blank=True)
    image_url = models.URLField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pos_products'

    def __str__(self):
        return f"{self.name} ({self.sku})"


class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    size = models.CharField(max_length=10, help_text="e.g. S, M, L, XL, 32, 34, 38, 40")
    color = models.CharField(max_length=50, help_text="e.g. Jet Black, Crisp White, Indigo")
    color_hex = models.CharField(max_length=10, blank=True)
    stock = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=3)
    sku = models.CharField(max_length=60, unique=True, db_index=True)
    barcode = models.CharField(max_length=60, unique=True, db_index=True)

    class Meta:
        db_table = 'pos_product_variants'
        unique_together = ('product', 'size', 'color')

    def __str__(self):
        return f"{self.product.name} - {self.size}/{self.color} (Stock: {self.stock})"


class Customer(models.Model):
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, unique=True, db_index=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True)
    loyalty_points = models.PositiveIntegerField(default=0)
    due_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pos_customers'

    def __str__(self):
        return f"{self.name} ({self.phone})"


class Sale(models.Model):
    PAYMENT_CHOICES = (
        ('Cash', 'Cash'),
        ('UPI', 'UPI'),
        ('Card', 'Card'),
        ('Split', 'Split'),
    )
    STATUS_CHOICES = (
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('REFUNDED', 'Refunded'),
    )

    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True)
    cashier = models.ForeignKey(User, on_delete=models.PROTECT)
    date = models.DateTimeField(default=timezone.now)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    discount_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_gst = models.DecimalField(max_digits=10, decimal_places=2)
    taxable_total = models.DecimalField(max_digits=12, decimal_places=2)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='COMPLETED')
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'pos_sales'


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT)
    product_name = models.CharField(max_length=255)
    size = models.CharField(max_length=10)
    color = models.CharField(max_length=50)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'pos_sale_items'


class StockMovement(models.Model):
    TYPE_CHOICES = (
        ('SALE', 'Sale Deduction'),
        ('PURCHASE', 'Supplier PO Inflow'),
        ('RETURN', 'Customer Return'),
        ('ADJUSTMENT', 'Audit Adjustment'),
        ('DAMAGE', 'Damage Write-off'),
    )
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT, related_name='movements')
    movement_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    quantity_change = models.IntegerField()
    new_stock_level = models.PositiveIntegerField()
    reference_id = models.CharField(max_length=50)
    performed_by = models.CharField(max_length=100)
    reason = models.CharField(max_length=255, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pos_stock_movements'


class Expense(models.Model):
    category = models.CharField(max_length=100)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField(default=timezone.now)
    payment_mode = models.CharField(max_length=50)
    paid_to = models.CharField(max_length=150)
    approved_by = models.CharField(max_length=100)

    class Meta:
        db_table = 'pos_expenses'


class AuditLog(models.Model):
    action = models.CharField(max_length=100)
    entity = models.CharField(max_length=100)
    entity_id = models.CharField(max_length=100)
    details = models.TextField()
    user_name = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pos_audit_logs'
`,
    serializers: `"""
Django REST Framework Serializers
"""
from rest_framework import serializers
from .models import Product, ProductVariant, Sale, SaleItem, Customer, Supplier, Expense, StockMovement


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = '__all__'


class SaleItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleItem
        fields = '__all__'


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)

    class Meta:
        model = Sale
        fields = '__all__'

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        sale = Sale.objects.create(**validated_data)
        for item_data in items_data:
            SaleItem.objects.create(sale=sale, **item_data)
            # Atomic stock decrement
            variant = item_data['variant']
            variant.stock -= item_data['quantity']
            variant.save()
        return sale
`,
    views: `"""
Django REST Framework API Views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from .models import Product, ProductVariant, Sale, Customer, Supplier, Expense
from .serializers import ProductSerializer, SaleSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.prefetch_related('variants').all()
    serializer_class = ProductSerializer

    @action(detail=False, methods=['get'])
    def scan(self, request):
        code = request.query_params.get('code')
        variant = ProductVariant.objects.filter(models.Q(barcode=code) | models.Q(sku=code)).first()
        if variant:
            return Response(ProductSerializer(variant.product).data)
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.prefetch_related('items').order_by('-date')
    serializer_class = SaleSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
`,
    urls: `"""
URL Routing for Django REST Framework
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, SaleViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'sales', SaleViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]
`,
    schema: `-- MySQL Normalized Database DDL Schema
-- System: Aura Men's Wear POS & Inventory Engine
-- Target: MySQL 8.0+

CREATE DATABASE IF NOT EXISTS aura_menswear_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aura_menswear_db;

-- 1. Users Table
CREATE TABLE pos_users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(150) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'cashier') NOT NULL DEFAULT 'cashier',
    pin VARCHAR(4) NOT NULL,
    email VARCHAR(254),
    phone VARCHAR(20),
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories
CREATE TABLE pos_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE
);

-- 3. Suppliers
CREATE TABLE pos_suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    gstin VARCHAR(20),
    outstanding_balance DECIMAL(12,2) DEFAULT 0.00
);

-- 4. Products Master
CREATE TABLE pos_products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    barcode VARCHAR(50) NOT NULL UNIQUE,
    category_id INT NOT NULL,
    brand VARCHAR(100) NOT NULL,
    supplier_id INT,
    purchase_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    mrp DECIMAL(10,2) NOT NULL,
    gst_rate DECIMAL(5,2) DEFAULT 12.00,
    description TEXT,
    image_url VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES pos_categories(id),
    FOREIGN KEY (supplier_id) REFERENCES pos_suppliers(id) ON DELETE SET NULL
);

-- 5. Product Variants (Size x Color Matrix)
CREATE TABLE pos_product_variants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    size VARCHAR(10) NOT NULL,
    color VARCHAR(50) NOT NULL,
    color_hex VARCHAR(10),
    stock INT UNSIGNED NOT NULL DEFAULT 0,
    low_stock_threshold INT UNSIGNED NOT NULL DEFAULT 3,
    sku VARCHAR(60) NOT NULL UNIQUE,
    barcode VARCHAR(60) NOT NULL UNIQUE,
    FOREIGN KEY (product_id) REFERENCES pos_products(id) ON DELETE CASCADE,
    UNIQUE KEY uq_variant (product_id, size, color)
);

-- 6. Customers Table
CREATE TABLE pos_customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100),
    address TEXT,
    loyalty_points INT UNSIGNED DEFAULT 0,
    due_balance DECIMAL(10,2) DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Sales Invoices
CREATE TABLE pos_sales (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT,
    cashier_id BIGINT NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(12,2) NOT NULL,
    discount_total DECIMAL(10,2) DEFAULT 0.00,
    total_gst DECIMAL(10,2) NOT NULL,
    taxable_total DECIMAL(12,2) NOT NULL,
    grand_total DECIMAL(12,2) NOT NULL,
    payment_method ENUM('Cash', 'UPI', 'Card', 'Split') NOT NULL,
    status ENUM('COMPLETED', 'CANCELLED', 'REFUNDED') DEFAULT 'COMPLETED',
    notes TEXT,
    FOREIGN KEY (customer_id) REFERENCES pos_customers(id) ON DELETE SET NULL,
    FOREIGN KEY (cashier_id) REFERENCES pos_users(id)
);

-- 8. Sale Items
CREATE TABLE pos_sale_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sale_id BIGINT NOT NULL,
    variant_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    size VARCHAR(10) NOT NULL,
    color VARCHAR(50) NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0.00,
    gst_rate DECIMAL(5,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES pos_sales(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES pos_product_variants(id)
);

-- 9. Stock Movements Audit Ledger
CREATE TABLE pos_stock_movements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    variant_id BIGINT NOT NULL,
    movement_type ENUM('SALE', 'PURCHASE', 'RETURN', 'ADJUSTMENT', 'DAMAGE') NOT NULL,
    quantity_change INT NOT NULL,
    new_stock_level INT UNSIGNED NOT NULL,
    reference_id VARCHAR(50) NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    reason VARCHAR(255),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (variant_id) REFERENCES pos_product_variants(id)
);

-- 10. Audit Logs
CREATE TABLE pos_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details TEXT,
    user_name VARCHAR(100) NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContents[selectedFile]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename =
      selectedFile === 'models'
        ? 'models.py'
        : selectedFile === 'serializers'
        ? 'serializers.py'
        : selectedFile === 'views'
        ? 'views.py'
        : selectedFile === 'urls'
        ? 'urls.py'
        : 'schema.sql';

    const blob = new Blob([fileContents[selectedFile]], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Top Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-amber-400" />
            <span>Python Django REST Framework & MySQL Normalized Architecture</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Production backend blueprint with ORM models, relational foreign keys, serializers, views and MySQL DDL
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy File'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs transition-colors shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Source</span>
          </button>
        </div>
      </div>

      {/* File Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto text-xs">
        {[
          { id: 'models', label: 'models.py (Django ORM)', icon: Code2 },
          { id: 'serializers', label: 'serializers.py (DRF)', icon: Layers },
          { id: 'views', label: 'views.py (REST API)', icon: Server },
          { id: 'urls', label: 'urls.py (Routes)', icon: Code2 },
          { id: 'schema', label: 'schema.sql (MySQL DDL)', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = selectedFile === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedFile(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-medium whitespace-nowrap transition-colors ${
                active
                  ? 'bg-amber-400 text-black font-bold shadow-xs'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Code Editor Preview Window */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-zinc-900/90 px-4 py-2 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
            <span className="ml-2 text-zinc-300 font-semibold">
              {selectedFile === 'schema' ? 'mysql/schema.sql' : `django_pos_api/${selectedFile}.py`}
            </span>
          </div>
          <span>Python 3.11 / Django 5.0 / MySQL 8.0</span>
        </div>

        <pre className="p-4 text-xs font-mono text-zinc-300 overflow-x-auto max-h-[600px] leading-relaxed selection:bg-amber-500/30">
          <code>{fileContents[selectedFile]}</code>
        </pre>
      </div>
    </div>
  );
};
