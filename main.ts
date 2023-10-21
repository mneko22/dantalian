import { parse } from "https://deno.land/std@0.204.0/flags/mod.ts";
import { BookshelfRepo, BookshelService } from "./bookshelf.ts";

function main(args: string[], service: BookshelService): Promise<void> {
  const parsedArgs = parse(args);
  switch (parsedArgs._[0]) {
    case "add":
      return service.add();
    case "ls":
      return service.getBookList();
    case "tags":
      return service.getBookListByTag();
    default:
      return service.getBookList();
  }
}

if (import.meta.main) {
  const kv = await Deno.openKv();
  const rep = new BookshelfRepo(kv);
  const sv = new BookshelService(rep);
  await main(Deno.args, sv);
}
