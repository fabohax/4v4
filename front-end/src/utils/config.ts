// utils/config.ts
import { PinataSDK } from "pinata";

const pinataJwt = process.env.PINATA_JWT;
const pinataGateway = process.env.PINATA_GATEWAY_URL; 

if (!pinataJwt || !pinataGateway) {
    throw new Error("Pinata JWT or Gateway URL environment variables not set.");
}

export const pinata = new PinataSDK({
    pinataJwt: pinataJwt,
    pinataGateway: pinataGateway,
});