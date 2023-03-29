# Interview Search

## Description

Automated tool that searches in the [hiring-without-whiteboards](https://github.com/poteto/hiring-without-whiteboards) list for potential job ads. 

It searches for keywords(python, docker, whatever) in each page from the list. Plus it tries to go a level deeper and follow any button or link that contains a predefined keyword(join, career, etc). If such links are found, the search for the main keywords is repeated there.

The search is case insensitive. A browser window opens while the search is performed so you can see it at work.

During the search it will create 3 lists:

-   urls containing keywords
-   errored urls
-   not matching urls

Eventually these will be filtered by hand into:

-   favourite
-   ignored

## Notes

-   This app is intended to sift thru the list in an easy manner and am happy if I find a few job openings along the way!

-   The app and methodology is clearly not bulletproof and I am sure a lot of results are not found.

-   There's much room to improve the app, like scraping in parallel for instance, add stats, etc. For now that's not a priority, but PRs are welcomed!

-   After search the app will create a `db.json` file. If you want to start fresh just delete the file and restart the app.

-   If you use the app and it helps you, please leave a comment, improve the app, star the repo. Le me know you like it!

## Features

-   simple cli interface
-   random search in url list
-   exclude urls previously visited
-   resume search
-   filter the resulting lists
-   display the final favourite list

## Screenshots

![main menu](resources/main_menu.png 'Main menu') ![searching](resources/search.png 'Searching') ![sort list](resources/sort_list.png 'Sorting the list')

## Usage

1. Create a `.env` file in the root folder.
2. Add:

    - `TECHNOLOGIES_TERMS` - comma separated list of the technologies/terms you want to search for
    - `HREF_DISCOVER` - list of terms in the buttons or links that might reveal job openings. What's already here should pe pretty good
    - `HWW_LIST` - the url for the hiring-without-whiteboards list

3. `.env` file should look like this:

```
    TECHNOLOGIES_TERMS=python, docker, java
    HREF_DISCOVER=job, position, hiring, hire, listing, apply, career, join, application, vacancy, vacancies
    HWW_LIST='https://raw.githubusercontent.com/poteto/hiring-without-whiteboards/master/README.md'
```

4. run `npm install`
5. run `npm start`

## TODO

-   exit app function :D
-   more flexibility with each of the lists (reset, display, etc)
-   display company name and details in lists management
-   refine the user experience a bit
