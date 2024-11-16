export enum CACHE_KEY {
  AIR_POLUTION = "AIR_POLUTION",
}

export interface PolutionRequestPayload {
  location: string;
}

export interface GeoResponsePayload {
  name: string;
  lat: number;
  lon: number;
  country: string | "ID";
  state: string;
  local_names?: {};
}

type ListData = {
  dt: number;
  main: {
    aqi: number;
  };
  components: {
    co: number;
    no: number;
    no2: number;
    o3: number;
    so2: number;
    pm2_5: number;
    pm10: number;
    nh3: number;
  };
};

export interface AirPolutionResponsePayload {
  coord: {
    lon: number;
    lat: number;
  };
  list: ListData[];
}

export const airQualityCategories: any[] = [
  {
    name: "Good",
    index: 1,
    ranges: {
      so2: [0, 20],
      no2: [0, 40],
      pm10: [0, 20],
      pm2_5: [0, 10],
      o3: [0, 60],
      co: [0, 4400],
    },
  },
  {
    name: "Fair",
    index: 2,
    ranges: {
      so2: [20, 80],
      no2: [40, 70],
      pm10: [20, 50],
      pm2_5: [10, 25],
      o3: [60, 100],
      co: [4400, 9400],
    },
  },
  {
    name: "Moderate",
    index: 3,
    ranges: {
      so2: [80, 250],
      no2: [70, 150],
      pm10: [50, 100],
      pm2_5: [25, 50],
      o3: [100, 140],
      co: [9400, 12400],
    },
  },
  {
    name: "Poor",
    index: 4,
    ranges: {
      so2: [250, 350],
      no2: [150, 200],
      pm10: [100, 200],
      pm2_5: [50, 75],
      o3: [140, 180],
      co: [12400, 15400],
    },
  },
  {
    name: "Very Poor",
    index: 5,
    ranges: {
      so2: [350, Infinity],
      no2: [200, Infinity],
      pm10: [200, Infinity],
      pm2_5: [75, Infinity],
      o3: [180, Infinity],
      co: [15400, Infinity],
    },
  },
];
