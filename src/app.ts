import express, { Express, Request, Response } from "express";
import axios from "axios";
import "dotenv/config";
import {
  AirPolutionResponsePayload,
  airQualityCategories,
  CACHE_KEY,
  GeoResponsePayload,
} from "./app.interface";
import bodyParser from "body-parser";
import Redis from "ioredis";
import { CronJob } from "cron";

const port = process.env.PORT || 3000;
const app: Express = express();
app.use(bodyParser.json());

const redis = new Redis({
  host: process.env.CACHE_HOST || "localhost",
  port: Number(process.env.CACHE_PORT) || 6379,
  password: process.env.CACHE_PASSWORD || "",
  db: Number(process.env.CACHE_DB) || 0,
});

async function fetchApiData(baseUrl: string) {
  return await axios
    .get(baseUrl)
    .then((response) => response.data)
    .catch((error) => {
      console.error(`Error fetching API because ${error}`);
      throw new Error(`Error fetch API`);
    });
}

function getAirQualityCategory(value: number, pollutant: string): string {
  for (const category of airQualityCategories) {
    const [min, max] = category.ranges[pollutant] || [0, 0];
    if (value >= min && value < max) {
      return category.name;
    }
  }
  return "Unknown";
}

function processAirPollutionResponse(
  airPollution: any
): Record<string, string> {
  const { main, components } = airPollution.list[0];
  const result: Record<string, string> = {};

  const aqiCategory =
    airQualityCategories.find((cat) => cat.index === main.aqi)?.name ||
    "Unknown";
  result["aqi"] = aqiCategory;

  for (const pollutant in components) {
    result[pollutant] = getAirQualityCategory(components[pollutant], pollutant);
  }

  return result;
}

app.get("/api", (_req, res) => {
  res.send(`Hello world!, it's air polution application`);
});

app.post("/api/air-polution", async (req: Request, res: Response) => {
  const { location } = req.body;
  const { details } = req.query;
  const key = CACHE_KEY.AIR_POLUTION + "_" + location?.toLowerCase();
  let cachedData: any = await redis.get(key);

  if (!cachedData) {
    const apiKey = process.env.OPEN_WEATHER_API_KEY;
    const GEO_ENDPOINT = `${process.env.OPEN_WEATHER_BASE_URL}/geo/1.0/direct?q=${location},id&limit=5&appid=${apiKey}`;

    try {
      const location: GeoResponsePayload[] = await fetchApiData(GEO_ENDPOINT);
      const POLUTION_ENDPOINT = `${process.env.OPEN_WEATHER_BASE_URL}/data/2.5/air_pollution?lat=${location[0].lat}&lon=${location[0].lon}&appid=${apiKey}`;
      const airPolution: AirPolutionResponsePayload = await fetchApiData(
        POLUTION_ENDPOINT
      );

      if (!airPolution || airPolution.list?.length == 0) {
        res.status(404).send({
          success: false,
          message: `Data not found`,
        });
      }

      cachedData = {
        location: location[0],
        airPolution,
      };

    await redis.set(key, JSON.stringify(cachedData));
    } catch (error: any) {
      res.status(400).send({
        success: false,
        message: `Error : ${error.message}`,
      });
    }
  } else {
    cachedData = JSON.parse(cachedData);
  }

  if (details && details === "true") {
    const conclussion = processAirPollutionResponse(cachedData.airPolution);
    cachedData = { ...cachedData, conclussion };
  }

  res.status(200).send({
    success: true,
    message: "Success get data from API",
    data: cachedData,
  });
});

new CronJob(
  "0 0 1 * * *",
  async () => {
    console.log(`[INFO] Start schedule job for delete cache every 1 hour`);
    redis.keys(`${CACHE_KEY.AIR_POLUTION}*`).then((keys: string[]) => {
      keys?.map(async (key: string) => await redis.del(key));
    });
  },
  null, // onComplete
  true // start
);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
