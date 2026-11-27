import { api } from "../api/axiosInstance";

//  Server vahid xəta formatından oxunaqlı mesaj çıxarır
export function getErrorMessage(error, fallback = "Something went wrong.") {
    const data = error.response?.data?.error;

    if (data?.code === "VALIDATION_ERROR" && Array.isArray(data.details) && data.details.length) {
        const first = data.details[0];
        const field = Array.isArray(first.path) ? first.path.join(".") : "";
        return field ? `${field}: ${first.message}` : first.message;
    };

    if (data?.message) return data.message;
    if (!error.response) return "Server is not responding. Please try again in a moment.";
    return fallback;
};

async function userSignUp(form) {
    const payload = {
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName.trim(),
        streetNum: form.streetNum.trim(),
        postalCode: String(form.postalCode),
        town: form.town.trim(),
        country: form.country,
    };

    if (form.company?.trim()) payload.company = form.company.trim();

    try {
        const res = await api.post("/auth/register" , payload);
        return res.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, "Registration failed."));
    };
};

async function userSignIn({ email, password }) {
    try {
        const res = await api.post("/auth/login" , { email: email.trim(), password });
        return res.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, "Email or password is invalid!"));
    };
};

export { userSignUp, userSignIn };

