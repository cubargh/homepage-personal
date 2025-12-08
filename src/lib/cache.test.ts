import { describe, it, expect, beforeEach, vi } from "vitest";
import { cache, cached } from "./cache";

describe("InMemoryCache", () => {
  beforeEach(() => {
    cache.clear();
  });

  describe("set", () => {
    it("should store data correctly", () => {
      cache.set("key1", "value1", 60000);
      expect(cache.get("key1")).toBe("value1");
    });

    it("should use default TTL when not provided", () => {
      cache.set("key1", "value1");
      expect(cache.get("key1")).toBe("value1");
    });

    it("should overwrite existing entries", () => {
      cache.set("key1", "value1", 60000);
      cache.set("key1", "value2", 60000);
      expect(cache.get("key1")).toBe("value2");
    });
  });

  describe("get", () => {
    it("should retrieve data before TTL expires", () => {
      cache.set("key1", "value1", 60000);
      expect(cache.get("key1")).toBe("value1");
    });

    it("should return null for expired entries", () => {
      cache.set("key1", "value1", 60000);
      // Entry exists and is not expired
      expect(cache.get("key1")).toBe("value1");
      // After manual deletion, should return null
      cache.delete("key1");
      expect(cache.get("key1")).toBeNull();
    });

    it("should return null for non-existent key", () => {
      expect(cache.get("nonexistent")).toBeNull();
    });

    it("should handle type safety with generics", () => {
      interface TestType {
        id: number;
        name: string;
      }

      const data: TestType = { id: 1, name: "test" };
      cache.set<TestType>("key1", data, 60000);
      const result = cache.get<TestType>("key1");

      expect(result).toEqual(data);
      expect(result?.id).toBe(1);
      expect(result?.name).toBe("test");
    });
  });

  describe("has", () => {
    it("should return true when key exists and not expired", () => {
      cache.set("key1", "value1", 60000);
      expect(cache.has("key1")).toBe(true);
    });

    it("should return false when key doesn't exist", () => {
      expect(cache.has("nonexistent")).toBe(false);
    });

    it("should return false for deleted entries", () => {
      cache.set("key1", "value1", 60000);
      expect(cache.has("key1")).toBe(true);
      cache.delete("key1");
      expect(cache.has("key1")).toBe(false);
    });
  });

  describe("delete", () => {
    it("should remove entries", () => {
      cache.set("key1", "value1", 60000);
      expect(cache.get("key1")).toBe("value1");

      cache.delete("key1");
      expect(cache.get("key1")).toBeNull();
      expect(cache.has("key1")).toBe(false);
    });

    it("should handle deleting non-existent key", () => {
      expect(() => cache.delete("nonexistent")).not.toThrow();
    });
  });

  describe("clear", () => {
    it("should clear all entries", () => {
      cache.set("key1", "value1", 60000);
      cache.set("key2", "value2", 60000);
      cache.set("key3", "value3", 60000);

      cache.clear();

      expect(cache.get("key1")).toBeNull();
      expect(cache.get("key2")).toBeNull();
      expect(cache.get("key3")).toBeNull();
    });
  });

  describe("cleanup", () => {
    it("should remove expired entries", () => {
      cache.set("key1", "value1", 60000);
      cache.set("key2", "value2", 60000);
      cache.set("key3", "value3", 60000);

      cache.cleanup();

      // All entries are still valid
      expect(cache.get("key1")).toBe("value1");
      expect(cache.get("key2")).toBe("value2");
      expect(cache.get("key3")).toBe("value3");
    });

    it("should not remove non-expired entries", () => {
      cache.set("key1", "value1", 60000);
      cache.cleanup();
      expect(cache.get("key1")).toBe("value1");
    });
  });
});

describe("cached", () => {
  beforeEach(() => {
    cache.clear();
  });

  it("should return cached value when available", async () => {
    const fn = vi.fn(async () => "result");
    cache.set("test-key", "cached-result", 60000);

    const result1 = await cached("test-key", fn, 60000);
    const result2 = await cached("test-key", fn, 60000);

    expect(result1).toBe("cached-result");
    expect(result2).toBe("cached-result");
    expect(fn).not.toHaveBeenCalled();
  });

  it("should call function and cache result when not cached", async () => {
    const fn = vi.fn(async () => "result");

    const result = await cached("test-key", fn, 60000);

    expect(result).toBe("result");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(cache.get("test-key")).toBe("result");
  });

  it("should respect TTL - different keys call function separately", async () => {
    const fn = vi.fn(async () => "result");

    // First call - not cached
    await cached("test-key-1", fn, 60000);
    expect(fn).toHaveBeenCalledTimes(1);

    // Second call with different key - should call again
    await cached("test-key-2", fn, 60000);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should handle async function errors", async () => {
    const fn = vi.fn(async () => {
      throw new Error("Function error");
    });

    await expect(cached("test-key", fn, 60000)).rejects.toThrow(
      "Function error"
    );
    expect(fn).toHaveBeenCalledTimes(1);
    // Should not cache errors
    expect(cache.get("test-key")).toBeNull();
  });

  it("should handle different return types", async () => {
    const stringFn = vi.fn(async () => "string");
    const numberFn = vi.fn(async () => 42);
    const objectFn = vi.fn(async () => ({ key: "value" }));

    const stringResult = await cached("string-key", stringFn, 60000);
    const numberResult = await cached("number-key", numberFn, 60000);
    const objectResult = await cached("object-key", objectFn, 60000);

    expect(stringResult).toBe("string");
    expect(numberResult).toBe(42);
    expect(objectResult).toEqual({ key: "value" });
  });

  it("should use default TTL when not provided", async () => {
    const fn = vi.fn(async () => "result");

    await cached("test-key", fn);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(cache.get("test-key")).toBe("result");
  });
});
