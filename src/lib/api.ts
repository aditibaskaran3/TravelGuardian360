import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 10_000,
});

export type DemoPost = {
  id: number;
  title: string;
  body: string;
};

export async function fetchDemoPost(id: number): Promise<DemoPost> {
  const { data } = await api.get<DemoPost>(`/posts/${id}`);
  return data;
}
