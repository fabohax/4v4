import { NextResponse, type NextRequest } from "next/server";
import { pinata } from "@/utils/config";
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const modelFile = data.get("file") as File | null;
    const imageFile = data.get("imageFile") as File | null;

    if (!modelFile) {
      return NextResponse.json({ error: "No model file provided" }, { status: 400 });
    }

    console.log('Uploading model file to Pinata:', modelFile.name);

    // Upload the model file to Pinata
    const modelResult = await pinata.upload.public.file(modelFile);
    if (!modelResult || !modelResult.IpfsHash) {
      throw new Error("Failed to upload model file to Pinata");
    }
    const modelCid = modelResult.IpfsHash;
    const modelUrl = `${process.env.PINATA_GATEWAY_URL}/ipfs/${modelCid}`;
    console.log('Model File CID:', modelCid);

    let imageCid = null;
    let imageUrl = null;

    // Upload the image file to Pinata (if provided)
    if (imageFile) {
      console.log('Uploading image file to Pinata:', imageFile.name);
      const imageResult = await pinata.upload.public.file(imageFile);
      if (!imageResult || !imageResult.IpfsHash) {
        throw new Error("Failed to upload image file to Pinata");
      }
      imageCid = imageResult.IpfsHash;
      imageUrl = `${process.env.PINATA_GATEWAY_URL}/ipfs/${imageCid}`;
      console.log('Image File CID:', imageCid);
    }

    // Debugging raw values before parsing
    console.log('Raw attributes:', data.get("attributes"));
    console.log('Raw interoperabilityFormats:', data.get("interoperabilityFormats"));
    console.log('Raw customizationData:', data.get("customizationData"));
    console.log('Raw properties:', data.get("properties"));
    console.log('Raw location:', data.get("location"));

    const parseJSON = (value: string | null) => {
      try {
        return value ? JSON.parse(value) : {};
      } catch {
        console.error('Invalid JSON:', value);
        throw new Error(`Invalid JSON format: ${value}`);
      }
    };

    const parseJSONOrArray = (value: string | null) => {
      try {
        // Try parsing as JSON
        return value ? JSON.parse(value) : [];
      } catch {
        // If parsing fails, treat it as a comma-separated string
        return value ? value.split(',').map((item) => item.trim()) : [];
      }
    };

    const parseLocation = (value: string | null) => {
      if (!value) return {};
      const match = value.match(/lat:\s*(-?\d+(\.\d+)?),\s*lon:\s*(-?\d+(\.\d+)?)/);
      if (match) {
        return {
          lat: parseFloat(match[1]),
          lon: parseFloat(match[3]),
        };
      }
      throw new Error(`Invalid location format: ${value}`);
    };

    // Generate metadata
    const metadata = {
      name: data.get("name") as string,
      description: data.get("description") as string,
      external_url: data.get("externalUrl") as string,
      attributes: parseJSON(data.get("attributes") as string | null),
      animation_url: modelUrl, // Link to the model file
      image: imageUrl, // Link to the image file
      interoperabilityFormats: parseJSONOrArray(data.get("interoperabilityFormats") as string | null),
      customizationData: parseJSON(data.get("customizationData") as string | null),
      edition: data.get("edition") as string,
      royalties: data.get("royalties") as string,
      properties: parseJSON(data.get("properties") as string | null),
      location: parseLocation(data.get("location") as string | null), // Use the custom parser
      soulbound: data.get("soulbound") === "true",
    };

    console.log('Parsed location:', metadata.location);
    console.log('Generated Metadata:', metadata);

    // Upload metadata JSON to Pinata
    const metadataResult = await pinata.upload.public.json(metadata);
    if (!metadataResult || !metadataResult.IpfsHash) {
      throw new Error("Failed to upload metadata to Pinata");
    }
    const metadataCid = metadataResult.IpfsHash;
    const tokenURI = `${process.env.PINATA_GATEWAY_URL}/ipfs/${metadataCid}`;
    console.log('Metadata CID:', metadataCid);

    // Return the metadata CID
    return NextResponse.json({ tokenURI }, { status: 200 });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: "Internal Server Error: " + (error instanceof Error ? error.message : "An unexpected error occurred") },
      { status: 500 }
    );
  }
}

pinata.upload.public.file = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`, // Use the JWT from your environment variables
      },
    });

    console.log('Pinata File Upload Response:', response.data);
    return response.data; // Return the response from Pinata
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Pinata File Upload Error:', error.response?.data || error.message);
    } else {
      console.error('Pinata File Upload Error:', error);
    }
    throw new Error('Failed to upload model file to Pinata');
  }
};
