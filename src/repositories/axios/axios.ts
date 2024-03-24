import axios from "axios";
import dotenv from "dotenv";
import Elysia from "elysia";

dotenv.config();

if (!process.env.APPLICATION_BASE_URL) {
  throw new Error("APPLICATION_BASE_URL is not defined");
}
if (!process.env.DATALINK_BASE_URL) {
  throw new Error("DATALINK_BASE_URL is not defined");
}

export const applicationAxiosInstance = axios.create({
  baseURL: process.env.APPLICATION_BASE_URL,
});

export const datalinkAxiosInstance = axios.create({
  baseURL: process.env.DATALINK_BASE_URL,
});

export const axiosInstance = new Elysia({ name: "axiosInstance" }).decorate(
  () => ({
    applicationAxiosInstance,
    datalinkAxiosInstance,
  })
);
