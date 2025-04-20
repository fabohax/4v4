import { NextResponse, type NextRequest } from "next/server";
import { pinata } from "@/utils/config";

export async function POST(request: NextRequest) {
    try {
        const data = await request.formData();
        const file = data.get("file") as File | null;
        const imageFile = data.get("imageFile") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No model file provided" }, { status: 400 });
        }

        const parseJSON = (value: string | null) => {
            try {
                return value ? JSON.parse(value) : {};
            } catch {
                return {};
            }
        };

        const metadata = {
            name: data.get("name") as string,
            description: data.get("description") as string,
            external_url: data.get("externalUrl") as string,
            attributes: parseJSON(data.get("attributes") as string | null),
            animation_url: "",
            interoperabilityFormats: parseJSON(data.get("interoperabilityFormats") as string | null),
            customizationData: parseJSON(data.get("customizationData") as string | null),
            edition: data.get("edition") as string,
            royalties: data.get("royalties") as string,
            properties: parseJSON(data.get("properties") as string | null),
            location: parseJSON(data.get("location") as string | null),
            soulbound: data.get("soulbound") === "true",
            image: ""
        };

        // Upload model file
        const modelResult = await pinata.upload.public.file(file);
        metadata.animation_url = `${process.env.PINATA_GATEWAY_URL}/ipfs/${modelResult.cid}`;

        // Upload image file if available
        if (imageFile) {
            const imageResult = await pinata.upload.public.file(imageFile);
            metadata.image = `${process.env.PINATA_GATEWAY_URL}/ipfs/${imageResult.cid}`;
        }

        // Upload metadata
        const metadataResult = await pinata.upload.public.json(metadata);
        const tokenURI = `${process.env.PINATA_GATEWAY_URL}/ipfs/${metadataResult.cid}`;

        return NextResponse.json({ tokenURI }, { status: 200 });
    } catch (error) {
        console.error("Error in API route:", error);
        return NextResponse.json(
            { error: "Internal Server Error: " + (error instanceof Error ? error.message : "An unexpected error occurred") },
            { status: 500 }
        );
    }
}
