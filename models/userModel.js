import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
    },
    firstname: {
        type: String,
        required: true,
    },
    username: {
        type: String,
    },
});

const userModel = mongoose.model("Users", userSchema);
export default userModel;