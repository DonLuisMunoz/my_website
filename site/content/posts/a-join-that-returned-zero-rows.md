You run a join, it finishes fine, and the result is empty. No error, no warning, just zero rows. That one caught me on the Tampa affordability project, and the fix turned out to be one column name.

I'm building a table that puts rent, home values, and income side by side for every ZIP in Florida. Rent comes from Zillow's ZORI file, home values from Zillow's ZHVI file, and median household income comes from the Census B19013 tables. All three are keyed by ZIP, so joining them looked like the easy part.

## What I wrote

```sql
FROM zhvi_long z
JOIN b19013_long b ON z.region_id = b.zip
```

`region_id` sounds like the ZIP. It isn't. It's Zillow's own internal ID for the row, something like 72715. The real ZIP lives in a column Zillow calls `RegionName`, and that's the 33510 I was actually looking for.

So Postgres compared two sets of numbers that never overlap, found no matches, and did exactly what I asked it to do. Zero rows is a correct answer to a wrong question.

## Why nothing errored

A database only complains when the syntax is broken or the types can't be compared. Both of my columns held numbers, so the comparison was legal. It just wasn't meaningful.

That's the part worth keeping. An empty result set isn't a failure the database will flag for you, it's a finding you have to go read. Now when a join comes back empty, I stop rewriting the logic and go look at what's actually inside the keys.

The check takes about ten seconds:

```sql
SELECT region_id, "RegionName" FROM zhvi_long LIMIT 5;
```

Two values next to each other, and it's obvious which one is the ZIP.

## Where it landed

Once the keys matched, the rest moved. The Florida table came out at 6,895 rows, and Postgres accepted a primary key on `(zip, year)`. That constraint is the part I actually wanted. If the database will hold the key, the grain is proven and I don't have to keep hand-checking for duplicates. Scoped down to Hillsborough County, the view returns 480 rows.

I made the same shape of mistake twice more in that session. I grouped by month when I wanted a year, and I tried to average the `year` column instead of the thing that actually varies. All three came down to not looking closely enough at the column I was pointing at.

The database will answer whatever you ask it. It just won't tell you that you asked the wrong thing.
