import axios from "axios";

export const apiInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const gcAuthInstance = axios.create({
  baseURL: `https://login.${process.env.REACT_APP_GC_ENVIRONMENT}`,
  headers: {
    "Content-Type": "application/json",
  },
});

export const gcApiInstance = axios.create({
  baseURL: `https://api.${process.env.REACT_APP_GC_ENVIRONMENT}`,
  headers: {
    "Content-Type": "application/json",
  },
});

export const axiosInterceptor = async (instance, token) => {
  instance.interceptors.request.use(
    (config) => {
      if (config.headers)
        if (instance === gcApiInstance) {
          config.headers["Authorization"] = `Bearer ${token}`;
        } else {
          config.headers.token = token;
        }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};
