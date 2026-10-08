const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const Food = require("./models/Food");
const User = require("./models/User");
const Order = require("./models/Order");
const Admin = require("./models/Admin");

const app = express();

app.use(cors());
app.use(express.json());


// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {
    res.send("Campus Bite Server is Running");
});


// ===============================
// FOOD - ADD
// ===============================

app.post("/api/foods", async (req, res) => {
    try {
        const { name, price, image, category } = req.body;

        if (!name || !price || !image || !category) {
            return res.status(400).json({
                message: "All food fields are required."
            });
        }

        const food = new Food({
            name: name.trim(),
            price: Number(price),
            image: image.trim(),
            category: category.trim()
        });

        const savedFood = await food.save();

        res.status(201).json({
            message: "Food added successfully.",
            food: savedFood
        });

    } catch (error) {
        console.log("Add food error:", error);

        res.status(500).json({
            message: "Unable to add food."
        });
    }
});


// ===============================
// FOOD - GET ALL
// ===============================

app.get("/api/foods", async (req, res) => {
    try {
        const foods = await Food.find();

        res.json(foods);

    } catch (error) {
        console.log("Get foods error:", error);

        res.status(500).json({
            message: "Unable to fetch foods."
        });
    }
});


// ===============================
// FOOD - UPDATE
// ===============================

app.put("/api/foods/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            price,
            image,
            category,
            availability
        } = req.body;

        if (
            !name ||
            !price ||
            !image ||
            !category
        ) {
            return res.status(400).json({
                message:
                    "All food fields are required."
            });
        }

        const updatedFood =
            await Food.findByIdAndUpdate(
                id,
                {
                    name: name.trim(),
                    price: Number(price),
                    image: image.trim(),
                    category: category.trim(),
                    availability:
                        availability !== false
                },
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!updatedFood) {
            return res.status(404).json({
                message:
                    "Food not found."
            });
        }

        res.json({
            message:
                "Food updated successfully.",
            food: updatedFood
        });

    } catch (error) {

        console.log(
            "Update food error:",
            error
        );

        res.status(500).json({
            message:
                "Unable to update food."
        });
    }
});


// ===============================
// FOOD - DELETE
// ===============================

app.delete("/api/foods/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const deletedFood =
            await Food.findByIdAndDelete(id);

        if (!deletedFood) {
            return res.status(404).json({
                message: "Food not found."
            });
        }

        res.json({
            message: "Food deleted successfully."
        });

    } catch (error) {
        console.log("Delete food error:", error);

        res.status(500).json({
            message: "Unable to delete food."
        });
    }
});


// ===============================
// STUDENT REGISTER
// ===============================

app.post("/api/register", async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            password
        } = req.body;

        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                message: "All fields are required."
            });
        }

        const emailPattern =
            /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

        if (!emailPattern.test(email.trim())) {
            return res.status(400).json({
                message:
                    "Please enter a valid Gmail address."
            });
        }

        const phonePattern =
            /^[6-9][0-9]{9}$/;

        if (!phonePattern.test(phone)) {
            return res.status(400).json({
                message:
                    "Please enter a valid 10-digit mobile number."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message:
                    "Password must be at least 6 characters."
            });
        }

        const existingUser =
            await User.findOne({
                email: email.trim().toLowerCase()
            });

        if (existingUser) {
            return res.status(400).json({
                message:
                    "This email is already registered."
            });
        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const user = new User({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({
            message:
                "Registration successful."
        });

    } catch (error) {
        console.log("Registration error:", error);

        res.status(500).json({
            message:
                "Unable to register user."
        });
    }
});


// ===============================
// STUDENT LOGIN
// ===============================

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message:
                    "Email and password are required."
            });
        }

        const user =
            await User.findOne({
                email: email.trim().toLowerCase()
            });

        if (!user) {
            return res.status(401).json({
                message:
                    "Invalid email or password."
            });
        }

        let passwordMatch = false;

        try {
            passwordMatch =
                await bcrypt.compare(
                    password,
                    user.password
                );
        } catch (error) {
            passwordMatch = false;
        }

        // Support old plain-text passwords
        if (!passwordMatch && password === user.password) {
            passwordMatch = true;

            const newHashedPassword =
                await bcrypt.hash(password, 10);

            user.password = newHashedPassword;

            await user.save();
        }

        if (!passwordMatch) {
            return res.status(401).json({
                message:
                    "Invalid email or password."
            });
        }

        res.json({
            message: "Login successful.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone
            }
        });

    } catch (error) {
        console.log("Login error:", error);

        res.status(500).json({
            message:
                "Unable to login."
        });
    }
});


// ===============================
// UPDATE STUDENT PROFILE
// ===============================

app.put("/api/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone } = req.body;

        if (!name || !email || !phone) {
            return res.status(400).json({
                message: "All fields are required."
            });
        }

        const emailPattern =
            /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

        if (!emailPattern.test(email.trim())) {
            return res.status(400).json({
                message:
                    "Please enter a valid Gmail address."
            });
        }

        const phonePattern =
            /^[6-9][0-9]{9}$/;

        if (!phonePattern.test(phone)) {
            return res.status(400).json({
                message:
                    "Please enter a valid 10-digit mobile number."
            });
        }

        const existingUser =
            await User.findOne({
                email:
                    email.trim().toLowerCase(),
                _id: { $ne: id }
            });

        if (existingUser) {
            return res.status(400).json({
                message:
                    "This email is already registered with another account."
            });
        }

        const updatedUser =
            await User.findByIdAndUpdate(
                id,
                {
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    phone: phone
                },
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!updatedUser) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        res.json({
            message:
                "Profile updated successfully.",
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone
            }
        });

    } catch (error) {
        console.log(
            "Profile update error:",
            error
        );

        res.status(500).json({
            message:
                "Unable to update profile."
        });
    }
});


// ===============================
// ADMIN LOGIN
// ===============================

app.post("/api/admin/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message:
                    "Username and password are required."
            });
        }

        const admin =
            await Admin.findOne({
                username: username.trim()
            });

        if (!admin) {
            return res.status(401).json({
                message:
                    "Invalid username or password."
            });
        }

        const passwordMatch =
            await bcrypt.compare(
                password,
                admin.password
            );

        if (!passwordMatch) {
            return res.status(401).json({
                message:
                    "Invalid username or password."
            });
        }

        res.json({
            message:
                "Admin login successful.",
            admin: {
                id: admin._id,
                username: admin.username,
                role: admin.role
            }
        });

    } catch (error) {
        console.log(
            "Admin login error:",
            error
        );

        res.status(500).json({
            message:
                "Unable to login admin."
        });
    }
});


// ===============================
// PLACE ORDER
// ===============================

app.post("/api/orders", async (req, res) => {
    try {
        const {
            userId,
            customerName,
            email,
            phone,
            items,
            totalAmount,
            pickupTime,
            paymentMethod,
            specialRequirement
        } = req.body;

        if (
            !userId ||
            !customerName ||
            !email ||
            !phone ||
            !items ||
            items.length === 0 ||
            totalAmount === undefined ||
            !pickupTime ||
            !paymentMethod
        ) {
            return res.status(400).json({
                message:
                    "All order details are required."
            });
        }

        const phonePattern =
            /^[6-9][0-9]{9}$/;

        if (!phonePattern.test(phone)) {
            return res.status(400).json({
                message:
                    "Please enter a valid phone number."
            });
        }

        const order = new Order({
            userId,
            customerName,
            email,
            phone,
            items,
            totalAmount,
            pickupTime,
            paymentMethod,
            specialRequirement:
                specialRequirement
                    ? specialRequirement.trim()
                    : "",
            status: "Pending"
        });

        const savedOrder =
            await order.save();

        res.status(201).json({
            message:
                "Order placed successfully.",
            order: savedOrder
        });

    } catch (error) {
        console.log(
            "Place order error:",
            error
        );

        res.status(500).json({
            message:
                "Unable to place order."
        });
    }
});


// ===============================
// PICKUP TIME SORTING
// ===============================

function getPickupMinutes(pickupTime) {

    if (!pickupTime) {
        return 999999;
    }

    const timeMatch =
        pickupTime.match(
            /(\d+):(\d+)\s*(AM|PM)/i
        );

    if (!timeMatch) {
        return 999999;
    }

    let hours =
        parseInt(timeMatch[1]);

    const minutes =
        parseInt(timeMatch[2]);

    const period =
        timeMatch[3].toUpperCase();

    if (period === "AM" && hours === 12) {
        hours = 0;
    }

    if (period === "PM" && hours !== 12) {
        hours += 12;
    }

    return (
        hours * 60 +
        minutes
    );
}


// ===============================
// GET ORDERS
// ===============================

app.get("/api/orders", async (req, res) => {
    try {

        const { userId } = req.query;

        let orders;

        if (userId) {

            orders =
                await Order.find({
                    userId: userId
                }).sort({
                    orderDate: -1
                });

        } else {

            orders =
                await Order.find();

            orders.sort(
                (a, b) =>
                    getPickupMinutes(
                        a.pickupTime
                    ) -
                    getPickupMinutes(
                        b.pickupTime
                    )
            );
        }

        res.json(orders);

    } catch (error) {

        console.log(
            "Get orders error:",
            error
        );

        res.status(500).json({
            message:
                "Unable to fetch orders."
        });
    }
});


// ===============================
// UPDATE ORDER STATUS
// ===============================

app.put(
    "/api/orders/:id/status",
    async (req, res) => {

        try {

            const { id } = req.params;
            const { status } = req.body;

            const validStatuses = [
                "Pending",
                "Preparing",
                "Prepared",
                "Complete"
            ];

            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    message:
                        "Invalid order status."
                });
            }

            const updatedOrder =
                await Order.findByIdAndUpdate(
                    id,
                    {
                        status: status
                    },
                    {
                        new: true
                    }
                );

            if (!updatedOrder) {
                return res.status(404).json({
                    message:
                        "Order not found."
                });
            }

            res.json({
                message:
                    "Order status updated successfully.",
                order: updatedOrder
            });

        } catch (error) {

            console.log(
                "Update order status error:",
                error
            );

            res.status(500).json({
                message:
                    "Unable to update order status."
            });
        }
    }
);


// ===============================
// DELETE COMPLETED ORDER
// ===============================

app.delete(
    "/api/orders/:id",
    async (req, res) => {

        try {

            const { id } = req.params;

            const order =
                await Order.findById(id);

            if (!order) {
                return res.status(404).json({
                    message:
                        "Order not found."
                });
            }

            if (order.status !== "Complete") {
                return res.status(400).json({
                    message:
                        "Only completed orders can be deleted."
                });
            }

            await Order.findByIdAndDelete(id);

            res.json({
                message:
                    "Completed order deleted successfully."
            });

        } catch (error) {

            console.log(
                "Delete order error:",
                error
            );

            res.status(500).json({
                message:
                    "Unable to delete order."
            });
        }
    }
);


// ===============================
// MONGODB CONNECTION
// ===============================

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {

        console.log(
            "MongoDB connected successfully"
        );

        app.listen(5000, () => {

            console.log(
                "Server running on port 5000"
            );

        });

    })
    .catch((error) => {

        console.log(
            "MongoDB connection error:",
            error
        );

    });