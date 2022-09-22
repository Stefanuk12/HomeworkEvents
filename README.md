# Homework Events
Handle homework through Discord events. Easily manage homework, allowing your classmates to co-ordinate and never forget about homework again.

## Setting up
- Make sure to download [Node JS](https://nodejs.org/en/download/) and then install Typescript by executing `npm i -g typescript` in your terminal/console
- Configure all of the details within the config file **or** set the `TOKEN` environment variable
- Import the template database file to your "SQL" server
- Run the `start.sh` file
  - If on windows, execute each line of the file seperate?

## Data Structure
This is mostly technical and purely for documentation.

### Class Object
| Name    | Description                                            | Type   | Optional |
| ------- | ------------------------------------------------------ | ------ | -------- |
| Guild   | The guild id for this object                           | string | NO       |
| Subject | The corrosponding subject                              | string | NO       |
| Code    | A "class code" that distinguishes classes              | string | NO       |
| Teacher | The teacher's name for the specific subject class code | string | YES      |
| Room    | The room of which the class is within                  | string | YES      |

### Homework Object
| Name     | Description                                                                          | Type   | Optional |
| -------- | ------------------------------------------------------------------------------------ | ------ | -------- |
| Subject  | The subject                                                                          | string | NO       |
| Class    | The class the homework was given to                                                  | string | NO       |
| Title    | A "short" description of the homework                                                | string | NO       |
| Due In   | In how many days the homework is due in                                              | number | NO       |
| Request  | A more in-depth description of the homework                                          | string | NO       |
| Textbook | The ISBN number to the textbook - which would corrolate to a download, if configured | number | YES      |

### Textbook Object
| Name    | Description                                 | Type   | Optional |
| ------- | ------------------------------------------- | ------ | -------- |
| Guild   | The guild id for this object                | string | NO       |
| Subject | What subject the textbook is for            | string | NO       |
| Title   | The title of the textbook                   | string | NO       |
| ISBN    | The ISBN number of the book                 | number | NO       |
| Link    | A link to the textbook download or purchase | string | YES      |
