# Testing different MongoDB wrappers.

## Mongoose
[Mongoose](http://mongoosejs.com/) seems to be most popular mongodb wrapper.
Although there are few things which I don't like (at least from the first sight).

Strict schema without strict checks.
One of the most noticable mongoose features is an ability to specify Schema for
data.
It looks a bit strange - is it adding a schema to the schema-less MongoDb?
But actually this can be very useful in most cases - we can ensure the data
we save is not some random garbage.
OK, let's try it:

    var mongoose = require('mongoose')
        , Schema = mongoose.Schema

    var userSchema = new Schema({
        name : String
    },{strict:'throw'});

    var User = mongoose.model('User',userSchema);

    mongoose.connect('mongodb://localhost/test',function(err){
        var user = new User({name:'Victor'});
        user.randomGarbage = 'test';
        user.save();
    })

What's the result? Does it throw the error?
Sadly, the answer is no - our 'randomGrabage' is not saved, but it is silently ignored.
The [answer](https://groups.google.com/forum/#!msg/mongoose-orm/TWA-CLrXGC8/sWd9obdVWPEJ) to that it is just how the mongoose works - it does not see such
a change to the model.
To make it work the 'markModified' call is needed:

    var user = new User({name:'Victor'});
    user.randomGarbage = 'test';
    user.markModified('randomGarbage');
    user.save();

Similar issues are mentioned in docs:
- For arrays you [need](http://mongoosejs.com/docs/faq.html) to "doc.array.set(3, 'val')" instead of "doc.array[3] = 'val'"
- For dates you [also need](http://mongoosejs.com/docs/schematypes.html) to call 'markModified'

Here is [related discussion](https://github.com/LearnBoost/mongoose/issues/1598) on github.
I didn't check how exactly mongoose works, but it sounds a bit strange.
Why it can't just go over object fields to find these changes?

Another (similar in terms of usability) issue is with [instance methods](http://mongoosejs.com/docs/guide.html): "Overwriting a default mongoose document method may lead to unpredictible results".

So while Mongoose aim seems to provide a more safe and reliable way to work with
MonogoDb it actually introduces several ways to break your code without having
any indication of the error.
In my opinion such things should not be just described in documentation and treated
as normal situation. The library should handle them and raise explicit errors.
