"use client";
import { hc } from "hono/client";
import type { AppType } from "@/hono";
const client = hc<AppType>("http://localhost:3000/");


export default function UploadImage() {
    const uploadImage = async (file: File) => {
        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await client.api.uploadImage.$post({
                body: formData,
            

            });
           if(!response.ok){
            throw new Error(response.statusText);
            console.log("Image upload failed");
           }

           const data = await response.json();
              console.log(data);
              return data;

               
        }catch(error){
            console.error("Error uploading image", error);
            
        }
    }
}



