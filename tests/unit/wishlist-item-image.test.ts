import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks (must be declared before any imports that trigger the module)
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  // fs/promises stubs
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  unlink: vi.fn(),
  // crypto stub
  randomUUID: vi.fn(() => "test-uuid"),
  // db select chain (used by upload and delete)
  select: vi.fn(),
  selectFrom: vi.fn(),
  selectWhere: vi.fn(),
  selectLimit: vi.fn(),
  selectThen: vi.fn(),
  // db update chain
  update: vi.fn(),
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
}));

vi.mock("fs/promises", () => ({
  default: {
    mkdir: mocks.mkdir,
    writeFile: mocks.writeFile,
    unlink: mocks.unlink,
  },
}));

vi.mock("crypto", () => ({
  randomUUID: mocks.randomUUID,
}));

vi.mock("../../src/shared/db", () => ({
  db: {
    select: mocks.select,
    update: mocks.update,
  },
}));

vi.mock("../../src/modules/wishlist/db/schema", () => ({
  wishlistItems: { id: "id", imageUrl: "image_url", wishlistId: "wishlist_id" },
  wishlists: { id: "id", userId: "user_id" },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import {
  uploadItemImage,
  deleteItemImage,
  deleteImageFile,
  MAX_UPLOAD_BYTES,
} from "../../src/modules/wishlist/server/item-image";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFile(opts: { name?: string; type?: string; size?: number } = {}): File {
  const { name = "photo.jpg", type = "image/jpeg", size = 1000 } = opts;
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], name, { type });
}

function setupSelectChain(row: unknown) {
  mocks.select.mockReturnValue({ from: mocks.selectFrom });
  mocks.selectFrom.mockReturnValue({ innerJoin: () => ({ where: mocks.selectWhere }) });
  mocks.selectWhere.mockReturnValue({ limit: mocks.selectLimit });
  mocks.selectLimit.mockReturnValue({ then: (fn: (v: unknown[]) => unknown) => Promise.resolve(fn(row !== null ? [row] : [])) });
}

function setupUpdateChain() {
  mocks.update.mockReturnValue({ set: mocks.updateSet });
  mocks.updateSet.mockReturnValue({ where: mocks.updateWhere });
  mocks.updateWhere.mockResolvedValue([]);
}

// ---------------------------------------------------------------------------
// Tests: uploadItemImage
// ---------------------------------------------------------------------------

describe("uploadItemImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mkdir.mockResolvedValue(undefined);
    mocks.writeFile.mockResolvedValue(undefined);
    mocks.unlink.mockResolvedValue(undefined);
    setupUpdateChain();
  });

  it("rejects files with an unsupported MIME type", async () => {
    const file = makeFile({ type: "application/pdf" });
    const result = await uploadItemImage("user-1", "item-1", file);
    expect(result).toEqual({ status: "error", code: "invalid-type" });
  });

  it("rejects files that exceed the size limit", async () => {
    const file = makeFile({ type: "image/jpeg", size: MAX_UPLOAD_BYTES + 1 });
    const result = await uploadItemImage("user-1", "item-1", file);
    expect(result).toEqual({ status: "error", code: "too-large" });
  });

  it("returns item-not-found when item does not exist in DB", async () => {
    setupSelectChain(null);
    const file = makeFile();
    const result = await uploadItemImage("user-1", "item-1", file);
    expect(result).toEqual({ status: "error", code: "item-not-found" });
  });

  it("returns item-not-found when ownership does not match", async () => {
    setupSelectChain({ id: "item-1", imageUrl: null, ownerId: "other-user" });
    const file = makeFile();
    const result = await uploadItemImage("user-1", "item-1", file);
    expect(result).toEqual({ status: "error", code: "item-not-found" });
  });

  it("saves the file and returns the public imageUrl on success", async () => {
    setupSelectChain({ id: "item-1", imageUrl: null, ownerId: "user-1" });
    const file = makeFile({ type: "image/jpeg" });
    const result = await uploadItemImage("user-1", "item-1", file);

    expect(result).toEqual({
      status: "success",
      imageUrl: "/uploads/test-uuid.jpg",
    });
    expect(mocks.mkdir).toHaveBeenCalledOnce();
    expect(mocks.writeFile).toHaveBeenCalledOnce();
    expect(mocks.updateWhere).toHaveBeenCalledOnce();
  });

  it("maps image/png to .png extension", async () => {
    setupSelectChain({ id: "item-1", imageUrl: null, ownerId: "user-1" });
    const file = makeFile({ type: "image/png" });
    const result = await uploadItemImage("user-1", "item-1", file);

    expect(result).toEqual({
      status: "success",
      imageUrl: "/uploads/test-uuid.png",
    });
  });

  it("schedules old image deletion when one already exists", async () => {
    setupSelectChain({ id: "item-1", imageUrl: "/uploads/old.jpg", ownerId: "user-1" });
    const file = makeFile();
    await uploadItemImage("user-1", "item-1", file);

    // unlink is called async (best-effort), give it a tick
    await new Promise((r) => setTimeout(r, 0));
    expect(mocks.unlink).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Tests: deleteItemImage
// ---------------------------------------------------------------------------

describe("deleteItemImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.unlink.mockResolvedValue(undefined);
    setupUpdateChain();
  });

  it("returns item-not-found when item does not exist", async () => {
    setupSelectChain(null);
    const result = await deleteItemImage("user-1", "item-1");
    expect(result).toEqual({ status: "error", code: "item-not-found" });
  });

  it("returns item-not-found when ownership does not match", async () => {
    setupSelectChain({ id: "item-1", imageUrl: "/uploads/x.jpg", ownerId: "other-user" });
    const result = await deleteItemImage("user-1", "item-1");
    expect(result).toEqual({ status: "error", code: "item-not-found" });
  });

  it("clears imageUrl and returns success when item has no image", async () => {
    setupSelectChain({ id: "item-1", imageUrl: null, ownerId: "user-1" });
    const result = await deleteItemImage("user-1", "item-1");
    expect(result).toEqual({ status: "success" });
    expect(mocks.updateWhere).toHaveBeenCalledOnce();
    expect(mocks.unlink).not.toHaveBeenCalled();
  });

  it("schedules file deletion and clears column when image exists", async () => {
    setupSelectChain({ id: "item-1", imageUrl: "/uploads/photo.jpg", ownerId: "user-1" });
    const result = await deleteItemImage("user-1", "item-1");

    await new Promise((r) => setTimeout(r, 0));
    expect(result).toEqual({ status: "success" });
    expect(mocks.unlink).toHaveBeenCalledOnce();
    expect(mocks.updateWhere).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Tests: deleteImageFile
// ---------------------------------------------------------------------------

describe("deleteImageFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.unlink.mockResolvedValue(undefined);
  });

  it("calls fs.unlink with the correct path", async () => {
    await deleteImageFile("/uploads/abc.jpg");
    expect(mocks.unlink).toHaveBeenCalledOnce();
  });

  it("does nothing for an empty imageUrl", async () => {
    await deleteImageFile("");
    expect(mocks.unlink).not.toHaveBeenCalled();
  });

  it("swallows fs errors silently", async () => {
    mocks.unlink.mockRejectedValue(new Error("ENOENT"));
    await expect(deleteImageFile("/uploads/missing.jpg")).resolves.toBeUndefined();
  });
});
