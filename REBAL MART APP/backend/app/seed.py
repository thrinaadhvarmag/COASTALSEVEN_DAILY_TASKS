import datetime
from sqlalchemy.orm import Session
from .database import engine, Base, SessionLocal
from .models import User, Product, Order, OrderItem
from .auth import get_password_hash

INITIAL_PRODUCTS = [
    {
        "name": "Salaar Deva Titanium Oversized T-Shirt",
        "description": "Heavyweight 260 GSM French terry cotton with high-density Salaar Deva cinema artwork on the chest and back. Mineral acid wash gives each tee a distinct Khansaar grit aesthetic.",
        "price": 1299.0,
        "stock": 45,
        "image_url": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
        "actor_name": "Prabhas",
        "movie_name": "Salaar: Part 1 – Ceasefire",
        "category": "T-Shirts",
        "tags": "salaar, deva, oversized, heavy cotton, official merch",
        "rating": 4.95,
        "review_count": 68
    },
    {
        "name": "Kalki 2898 AD Bhairava Cyber Hoodie",
        "description": "Premium 380 GSM fleece hoodie inspired by Bhairava's dystopian costume in Kalki 2898 AD. Features double-layered hood, custom metal aglets, and reflective neon-gold embroidery.",
        "price": 2499.0,
        "stock": 30,
        "image_url": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
        "actor_name": "Prabhas",
        "movie_name": "Kalki 2898 AD",
        "category": "Hoodies",
        "tags": "kalki, bhairava, hoodie, cyberpunk, official merch",
        "rating": 5.0,
        "review_count": 42
    },
    {
        "name": "Baahubali Mahendra Armor Collector Figurine",
        "description": "Hand-painted 1:10 scale collector resin statue of Rebel Star Prabhas as Mahendra Baahubali. Hand-finished with genuine metallic accents, sculpted royal armor, and custom engraved display base.",
        "price": 3999.0,
        "stock": 14,
        "image_url": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
        "actor_name": "Prabhas",
        "movie_name": "Baahubali",
        "category": "Collectibles",
        "tags": "baahubali, mahendra, figurine, statue, limited edition",
        "rating": 4.98,
        "review_count": 89
    },
    {
        "name": "The Raja Saab Vintage Gold Cinema Poster",
        "description": "Limited archival museum-grade poster on 300 GSM matte cotton paper with gold foil stamping. Features original pre-release artwork of Rebel Star Prabhas in romantic-horror vintage glory.",
        "price": 799.0,
        "stock": 100,
        "image_url": "/events/rajasaab.webp",
        "actor_name": "Prabhas",
        "movie_name": "The Raja Saab",
        "category": "Posters",
        "tags": "raja saab, poster, vintage, gold foil, official merch",
        "rating": 4.9,
        "review_count": 31
    },
    {
        "name": "Saaho Undercover Neo-Noir Tactical Bomber",
        "description": "Matte-black weather-resistant flight jacket with reinforced brass zippers, utility sleeve pocket, and high-density Saaho insignia. Inspired by Prabhas's iconic high-octane entrance in Abu Dhabi.",
        "price": 3499.0,
        "stock": 20,
        "image_url": "/events/saaho.webp",
        "actor_name": "Prabhas",
        "movie_name": "Saaho",
        "category": "Hoodies",
        "tags": "saaho, bomber jacket, tactical, black, official merch",
        "rating": 4.88,
        "review_count": 55
    },
    {
        "name": "Mirchi Iconic Cutout Acrylic Standee",
        "description": "High-clarity 8-inch laser-cut acrylic display standee featuring the legendary 'Cutout Choosi Konni Konni Nammeyali' pose from Mirchi. Features custom pedestal with Rebel Star emblem.",
        "price": 699.0,
        "stock": 60,
        "image_url": "/events/mirchi.webp",
        "actor_name": "Prabhas",
        "movie_name": "Mirchi",
        "category": "Collectibles",
        "tags": "mirchi, standee, acrylic, cutout, official merch",
        "rating": 4.96,
        "review_count": 73
    },
    {
        "name": "Spirit Rebel Star Limited Graphic Tee",
        "description": "Pre-drop commemorative graphic tee for Sandeep Reddy Vanga's upcoming cop thriller 'Spirit'. 240 GSM combed cotton featuring bold typography and intense Rebel Star silhouette.",
        "price": 1199.0,
        "stock": 50,
        "image_url": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80",
        "actor_name": "Prabhas",
        "movie_name": "Spirit",
        "category": "T-Shirts",
        "tags": "spirit, vanga, rebel star, graphic tee, upcoming",
        "rating": 4.92,
        "review_count": 19
    },
    {
        "name": "Darling Retro Era Cinema Enamel Pin Set",
        "description": "Collector set of 3 die-cast hard enamel pins celebrating Prabhas's beloved romantic era. Finished with polished rose gold plating and deluxe rubber clutches.",
        "price": 499.0,
        "stock": 80,
        "image_url": "/events/darling.webp",
        "actor_name": "Prabhas",
        "movie_name": "Darling",
        "category": "Accessories",
        "tags": "darling, enamel pins, retro, romance, collector",
        "rating": 4.85,
        "review_count": 27
    },
    {
        "name": "Chatrapathi Sea Wave Heavy Canvas Art",
        "description": "Stretched premium cotton canvas print capturing the iconic tidal scene with the fiery red cinema title. Gallery wrapped on solid wooden stretcher bars, ready to hang.",
        "price": 1499.0,
        "stock": 25,
        "image_url": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80",
        "actor_name": "Prabhas",
        "movie_name": "Chatrapathi",
        "category": "Posters",
        "tags": "chatrapathi, canvas art, rajamouli, iconic, official merch",
        "rating": 4.97,
        "review_count": 48
    }
]

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        # 1. Primary Administrator Accounts
        for admin_email in ["thrinaadhvarma999@gmail.com", "gunjethrinaadhvarma999@gmail.com"]:
            admin = db.query(User).filter(User.email == admin_email).first()
            username = "Thrinaadh" if "gunje" not in admin_email else "GunjeThrinaadh"
            if not admin:
                # Also check if username exists to prevent conflicts
                existing_uname = db.query(User).filter(User.username == username).first()
                if existing_uname:
                    username = f"{username}_{random.randint(100, 999)}"
                admin = User(
                    username=username,
                    email=admin_email,
                    hashed_password=get_password_hash("Admin@123456"),
                    role="admin",
                    profile_image_url=None,
                    email_verified=True
                )
                db.add(admin)
            else:
                admin.hashed_password = get_password_hash("Admin@123456")
                admin.role = "admin"
                admin.email_verified = True
            db.commit()

        # Secondary demo admin
        demo_admin = db.query(User).filter(User.email == "admin@rebelmart.com").first()
        if not demo_admin:
            db.add(User(
                username="Admin",
                email="admin@rebelmart.com",
                hashed_password=get_password_hash("AdminPassword123!"),
                role="admin",
                email_verified=True
            ))
            db.commit()

        # 2. Primary Customer Account
        customer_email = "bingkosam2@gmail.com"
        customer = db.query(User).filter(User.email == customer_email).first()
        if not customer:
            customer = User(
                username="Bingkosam",
                email=customer_email,
                hashed_password=get_password_hash("Nanna@123"),
                role="customer",
                profile_image_url=None,
                email_verified=True
            )
            db.add(customer)
        else:
            customer.hashed_password = get_password_hash("Nanna@123")
            customer.role = "customer"
            customer.email_verified = True
        db.commit()
        db.refresh(customer)

        # Secondary demo customer
        demo_customer = db.query(User).filter(User.email == "customer@rebelmart.com").first()
        if not demo_customer:
            db.add(User(
                username="RebelFan_07",
                email="customer@rebelmart.com",
                hashed_password=get_password_hash("CustomerPassword123!"),
                role="customer",
                email_verified=True
            ))
            db.commit()

        # 3. Seed & Update Products
        existing_products = {p.name: p for p in db.query(Product).all()}
        for item in INITIAL_PRODUCTS:
            if item["name"] in existing_products:
                p = existing_products[item["name"]]
                p.image_url = item["image_url"]
                p.price = item["price"]
                p.stock = item["stock"]
                p.description = item["description"]
            else:
                prod = Product(**item)
                db.add(prod)
        db.commit()

        # 4. Seed Initial Orders for Analytics
        if db.query(Order).count() == 0:
            prods = db.query(Product).all()
            if prods and customer:
                p1, p2, p3 = prods[0], prods[1], prods[2]
                
                # Order 1: Delivered
                o1 = Order(
                    user_id=customer.id,
                    total_amount=round(p1.price * 2 + p2.price, 2),
                    status="DELIVERED",
                    customer_name="Vikram Reddy",
                    phone="9876543210",
                    address="Flat 402, Rebel Towers, Jubilee Hills",
                    city="Hyderabad",
                    state="Telangana",
                    pincode="500033",
                    delivery_instructions="Leave with security at main gate",
                    coupon_code="REBEL15",
                    discount_amount=400.0,
                    payment_method="COD",
                    payment_status="PAID",
                    created_at=datetime.datetime.utcnow() - datetime.timedelta(days=3)
                )
                db.add(o1)
                db.commit()
                db.refresh(o1)

                item1 = OrderItem(order_id=o1.id, product_id=p1.id, product_name=p1.name, quantity=2, unit_price=p1.price, subtotal=p1.price * 2, size="L", image_url=p1.image_url)
                item2 = OrderItem(order_id=o1.id, product_id=p2.id, product_name=p2.name, quantity=1, unit_price=p2.price, subtotal=p2.price, size="XL", image_url=p2.image_url)
                db.add_all([item1, item2])

                # Order 2: Processing
                o2 = Order(
                    user_id=customer.id,
                    total_amount=p3.price,
                    status="PROCESSING",
                    customer_name="Arjun Rao",
                    phone="9123456789",
                    address="House #18, Film Nagar",
                    city="Hyderabad",
                    state="Telangana",
                    pincode="500096",
                    delivery_instructions="Call before delivery",
                    coupon_code=None,
                    discount_amount=0.0,
                    payment_method="DEMO_PAYMENT",
                    payment_status="SIMULATED_PAID",
                    created_at=datetime.datetime.utcnow() - datetime.timedelta(days=1)
                )
                db.add(o2)
                db.commit()
                db.refresh(o2)

                item3 = OrderItem(order_id=o2.id, product_id=p3.id, product_name=p3.name, quantity=1, unit_price=p3.price, subtotal=p3.price, size="Standard", image_url=p3.image_url)
                db.add(item3)

                # Order 3: Confirmed
                o3 = Order(
                    user_id=customer.id,
                    total_amount=p1.price,
                    status="CONFIRMED",
                    customer_name="Siddharth Varma",
                    phone="9848022338",
                    address="Plot 12, Madhapur Cyber City",
                    city="Hyderabad",
                    state="Telangana",
                    pincode="500081",
                    delivery_instructions="Office hours delivery only",
                    coupon_code="WELCOME10",
                    discount_amount=130.0,
                    payment_method="COD",
                    payment_status="PENDING",
                    created_at=datetime.datetime.utcnow()
                )
                db.add(o3)
                db.commit()
                db.refresh(o3)

                item4 = OrderItem(order_id=o3.id, product_id=p1.id, product_name=p1.name, quantity=1, unit_price=p1.price, subtotal=p1.price, size="M", image_url=p1.image_url)
                db.add(item4)

                db.commit()

    finally:
        db.close()
