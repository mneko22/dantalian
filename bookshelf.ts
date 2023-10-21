import { ulid } from "https://deno.land/x/ulid@v0.3.0/mod.ts";

interface Book {
    title: string
    author?: string
    url?: string
    coverURL?: string
    tags: Tag[]
    status: string
}

interface iBookshelfRepository {
    getBooks(): Promise<Book[]>
    getTags(): Promise<Tag[]>
    getBooksByTag(tag: Tag): Promise<Book[]>
    getBook(id: string): Promise<Book|null>
    addBook(book: Book): Promise<boolean>
    updateBook(id: string, book: Book): Promise<boolean>
    removeBook(id: string): Promise<boolean>
}

type Tag = string

export class BookshelService {
    shelfRepo: iBookshelfRepository
    constructor(repo: iBookshelfRepository) {
        this.shelfRepo = repo
    }
    
    async add(): Promise<void> {
        const title = prompt("title? ->")
        if (title == null) {
            alert("Please enter a title")
            return
        }
        const author = prompt("auther? ->")
        const url = prompt("url? ->")
        const coverURL = prompt("cover url? ->")
        const tagStr = prompt("tag? ->")
        const tags = tagStr?.split("")
        const status = prompt("status? ->")
        const book: Book = {
            title: title,
            author: author ? author:undefined,
            url: url ? url : undefined,
            coverURL: coverURL ? coverURL : undefined,
            tags: tags?tags:[],
            status: status?status:"stack"
        }
        if (await this.shelfRepo.addBook(book)) {
            alert("success")
        }
    }
    async getBookList(): Promise<void> {
        const books = await this.shelfRepo.getBooks()
        for(const book of books){
            console.log("title: ", book.title, " author: ", book.author, " url: ", book.url, " status: ", book.status)
        }
    }
    async getTagList(): Promise<void> {
        const tags = await this.shelfRepo.getTags()
        for(const tag of tags) {
            console.log(tag)
        }
    }
    async getBookListByTag(): Promise<void> {
        const tag = prompt("tag ->")
        if (tag == null) {
            return
        }
        const books = await this.shelfRepo.getBooksByTag(tag)
        for(const book of books){
            console.log("title: ", book.title, " author: ", book.author, " url: ", book.url, " status: ", book.status)
        }
    }
}

export class BookshelfRepo implements iBookshelfRepository {
    kv: Deno.Kv
    constructor(kv: Deno.Kv) {
        this.kv = kv
    }

    async getBooks(): Promise<Book[]> {
        const it = this.kv.list<Book>({ prefix: ["books"] })
        const books: Book[] = []
        for await (const res of it) books.push(res.value)
        return books
    }

    async getTags(): Promise<Tag[]> {
        const it = this.kv.list<Tag>({prefix: ["tags"]})
        const tags: Tag[] = []
        for await (const res of it) tags.push(res.value)
        return tags
    }

    async getBooksByTag(tag: Tag): Promise<Book[]> {
        const it = this.kv.list<Book>({ prefix: ["tags",tag] })
        const books: Book[] = []
        for await (const res of it) books.push(res.value)
        return books
    }

    async getBook(id: string): Promise<Book|null> {
        const result = await this.kv.get<Book|null>(["books", id])
        return result.value
    }

    async addBook(book: Book): Promise<boolean> {
        const id = ulid()
        const tx = this.kv.atomic().set(["books", id], book)
        for (const t of book.tags) {
            tx.set(["tags", t, id], book)
        }
        const result = await tx.commit()
        return result.ok
    }

    async updateBook(id: string, book: Book): Promise<boolean> {
        const tx = this.kv.atomic().set(["books", id], book)
        for(const t of book.tags) {
            tx.set(["tags", t, id], book)
        }
        const result = await tx.commit()
        return result.ok
    }

    async removeBook(id: string): Promise<boolean> {
        const _res = await this.kv.delete(["books", id])
        return true
    }
}