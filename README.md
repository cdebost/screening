# Screening

Screening is a testing tool for Montage-based applications.
It runs as a Node.js web application and creates its own server.

# Installation Instructions

1. Install MongoDB from https://www.mongodb.org/downloads.
2. Create a folder named "data" inside mongo/bin and a folder named "db" inside that data folder.
3. The installation comes with many different executables. Run `mongo/bin/mongod --dbpath mongo/bin/data/db --directoryperdb`. The MongoDB server is now ready to work with screening.
4. Navigate to screening/public/control-room/ and `npm install`.
5. Navigate to screening/server/ and `npm install`.
6. Run `node screening/server`. The screening server is now locally up and running.
7. Install chromedriver (or any other driver for non-local devices) from https://code.google.com/p/selenium/wiki/ChromeDriver. Run ChromeDriver.
8. Open a web browser and navigate to http://localhost:8081/screening/control-room. Your chrome driver instance should appear at the bottom of the page. If it does not, click the "Add WebDriver Agent" button and input the driver's url (default for ChromeDriver instances is http://localhost:9515).
9. Screening is now ready to be used. Begin by creating a new script and either recording or writing the script manually.
