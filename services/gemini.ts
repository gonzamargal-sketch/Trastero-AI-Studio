
import { GoogleGenAI, Type } from "@google/genai";
import { StorageItem, StorageRoom, OptimizationSuggestion, StorageZone } from "../types";

export const analyzeItemPhoto = async (base64Image: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: 'Analiza este objeto para un inventario de trastero. Sugiere en ESPAÑOL: nombre, categoría y dimensiones aproximadas (ancho, alto, fondo en cm). Formato JSON.' }
      ]
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING },
          dimensions: {
            type: Type.OBJECT,
            properties: {
              width: { type: Type.NUMBER },
              height: { type: Type.NUMBER },
              depth: { type: Type.NUMBER }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const getSpaceOptimization = async (room: StorageRoom, items: StorageItem[], zones: StorageZone[]): Promise<(OptimizationSuggestion & { targetZoneId?: string })[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Tengo un trastero de ${room.dimensions.width}x${room.dimensions.height}x${room.dimensions.depth} cm.
    
    REGLA FÍSICA CRÍTICA: Los objetos NO PUEDEN atravesar las baldas de las estanterías. 
    Deben sentarse exactamente SOBRE una balda o en el suelo.
    
    ESTANTERÍAS DISPONIBLES:
    ${zones.map(z => `- ${z.name} (ID: ${z.id}): ${z.dimensions.width}x${z.dimensions.height}x${z.dimensions.depth} cm. 
      BALDAS (desde abajo hacia arriba): ${z.shelfHeights.map((h, i) => `Nivel ${i+1}: ${h}cm de altura disponible`).join(', ')}.
      Posición central estantería: x:${z.position.x}, y:${z.position.y}, z:${z.position.z}`).join('\n')}

    OBJETOS A ORGANIZAR:
    ${items.map(item => `- ${item.name} (ID: ${item.id}): ${item.dimensions.width}x${item.dimensions.height}x${item.dimensions.depth} cm`).join('\n')}
    
    INSTRUCCIONES:
    1. Calcula la posición Y sumando las alturas de las baldas necesarias.
    2. Ejemplo: Si un objeto de 20cm de alto va en el Nivel 2, su Y será: (Base Estantería) + (Altura Balda 1) + (Mitad de su propia altura).
    3. Asegúrate de que el objeto cabe en el hueco de la balda asignada.
    
    RESPONDE EN ESPAÑOL. JSON: { itemId, targetZoneId, suggestedPosition {x, y, z}, reasoning }.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            itemId: { type: Type.STRING },
            targetZoneId: { type: Type.STRING },
            suggestedPosition: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
                z: { type: Type.NUMBER }
              }
            },
            reasoning: { type: Type.STRING }
          },
          required: ['itemId', 'suggestedPosition', 'reasoning']
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
};
