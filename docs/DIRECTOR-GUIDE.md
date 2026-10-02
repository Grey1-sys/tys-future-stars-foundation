# Editing the Ty's Future Stars Foundation website

This is for LaSonya. You do not need to know anything technical to use it,
and you cannot break the website by following it.

**The short version:** go to **tysfuturestars.org/admin**, sign in, change
something, press **Save**. It is live in about a minute.

---

## Contents

1. [Before your first login (one-time, Grey does this)](#1-before-your-first-login)
2. [How to log in](#2-how-to-log-in)
3. [The one rule that explains everything](#3-the-one-rule)
4. [How to add an event](#4-how-to-add-an-event)
5. [How to post an update](#5-how-to-post-an-update)
6. [How to add a story — and the rule about children](#6-how-to-add-a-story)
7. [How to change the impact numbers and the donation goal](#7-impact-numbers-and-the-donation-goal)
8. [How to add a sponsor logo](#8-how-to-add-a-sponsor-logo)
9. [How to change any wording or photo on any page](#9-changing-wording-and-photos)
10. [How to hide something without deleting it](#10-hiding-something)
11. [If something looks broken](#11-if-something-looks-broken)
12. [What not to touch](#12-what-not-to-touch)

---

## 1. Before your first login

**This section is for Grey, not LaSonya. It happens once.**

The editor saves changes into the website's code repository on GitHub, so
LaSonya needs a GitHub account with permission to write to it.

### a) She needs a free GitHub account

Send her to **github.com/signup**. It is free. She needs:

- an email address she can open right now (GitHub emails a code)
- a username — anything, it is never shown on the website
- a password

Tell her to save the password somewhere she will find it again. She will
use this maybe twice a year, which is exactly long enough to forget it.

### b) Add her to the repository

1. Go to **github.com/Grey1-sys/tys-future-stars-foundation**
2. **Settings** → **Collaborators** → **Add people**
3. Enter her GitHub username
4. Give her the **Write** role. Not Admin — Write is everything she needs
   and nothing she doesn't.
5. She gets an email invitation. **She must click the link and accept it.**
   Until she does, the editor will let her sign in and then show nothing.

### c) Connect GitHub to Netlify, so the editor can sign her in

The editor uses Netlify to handle the GitHub login. One-time setup:

1. On GitHub: **Settings** (your personal settings, top-right avatar) →
   **Developer settings** → **OAuth Apps** → **New OAuth App**
   - Application name: `TFSF Website Editor`
   - Homepage URL: `https://tysfuturestars.org`
   - Authorization callback URL: `https://api.netlify.com/auth/done`
   - Register, then **Generate a new client secret**. Copy the **Client ID**
     and the **Client Secret** — the secret is shown once.
2. On Netlify: your site → **Site configuration** → **Access & security** →
   **OAuth** → **Install provider** → **GitHub**, and paste the Client ID
   and Client Secret.

That is it. There is no password to put in the website's code, and nothing
secret is stored in the repository.

### d) Check it yourself first

Open `https://tysfuturestars.org/admin`, sign in, change one word on a page,
save, and watch it go live. Do this **before** handing the guide over, so
her first attempt is not also the first test.

---

## 2. How to log in

1. Open **tysfuturestars.org/admin** on your phone or computer.
2. Press **Sign In with GitHub**.
3. Enter your GitHub username and password if it asks.
4. You will land on a screen with a list down the side: Events, Updates,
   Success stories, Impact numbers, and so on.

**Bookmark that page.** On an iPhone: the share button, then *Add to Home
Screen*. It will sit on your home screen like an app.

If it says you do not have access, check your email for the GitHub
invitation from Grey and click the Accept link in it.

---

## 3. The one rule

> **Saving publishes it.** There is no second "publish" button. When you
> press Save, the change goes to the live website, usually within a minute.

That is why almost everything has a switch at the top called **Show this on
the website**. Leave it **off** while you are still writing. Turn it **on**
when you are ready. You can save as many times as you like with it off —
nobody sees anything until you turn it on.

**You cannot break the website.** The worst you can do is publish a typo,
and you fix a typo the same way you made it.

---

## 4. How to add an event

1. **Events** in the side list.
2. Press the **+** (or **Add**) to add a new one to the list.
3. Fill it in. The boxes that matter:

   | Box | What to put |
   |---|---|
   | Show this on the website | **Leave OFF until everything else is right** |
   | Event name | What you'd call it on a flyer |
   | Short name for this entry | Lowercase with dashes: `spring-classic-2026` |
   | Date | Tap it and pick the day |
   | Time | However you'd say it: `10:00 AM – 4:00 PM` |
   | Place name | `Smyrna Community Center` |
   | Street address | The full address — this becomes a tappable Maps link |
   | One-line summary | One sentence; this is what people see in the list |
   | Full description | The longer version |
   | Sign-up link | Paste the Eventbrite / Google Form link, or leave empty |

4. Turn **Show this on the website** ON.
5. **Save.**

**Check the address twice.** It becomes a link that opens Maps, and a wrong
address sends a family to the wrong parking lot on a Saturday morning.

**No sign-up link yet?** Leave it empty. The page then says registration
details are coming, which is better than a button that goes nowhere. Come
back and add the link later.

Events move themselves. Once the date has passed it drops out of "Coming
up" and into "Recently" on its own. **You never have to delete an old
event.**

---

## 5. How to post an update

An update is a short news post. Three or four a year is plenty — it is the
main reason Google finds anything new on the site.

1. **Updates** in the side list → **+**
2. Fill in:
   - **Headline** — what happened
   - **Web address name** — lowercase with dashes: `fall-season-recap`
   - **Date**
   - **Written by** — your name
   - **One-line summary** — one or two sentences for the list
   - **The update itself** — the actual post. Press Enter twice between
     paragraphs.
   - **Photo** — optional, see below
3. Turn **Show this on the website** ON, then **Save**.

**If you add a photo you must fill in "Describe this photo."** Write what is
in it, as if to someone on the phone who cannot see it: *"Players lined up
along the baseline after a game, holding a trophy."* If you leave it blank
the photo will not appear at all — that is deliberate, so that blind
visitors are never shown a blank space with no explanation.

Once you have published an update, the web address name is in the link
people share. Changing it later breaks their link, so get it right first
time and then leave it alone.

---

## 6. How to add a story

A story is about one of our young people, in their own words.

### Read this part before anything else

Three switches control whether the story ever appears. The website checks
them and will simply refuse to show a story that does not pass:

| Switch | What it means |
|---|---|
| **Has this person agreed to have their story published?** | Only ON if you have actually asked them and they said yes |
| **Is this person under 18?** | Answer honestly |
| **Do you have a SIGNED media release on file for them?** | Only ON if a signed release is **physically in your files** |

**If the person is under 18, both the consent switch and the signed media
release switch must be ON.** A story about a child without a signed release
on file will not appear on the website no matter what else you fill in, and
no matter how many times you save it.

That is not a bug and it is not something to work around. It is the
protection for that child and for the foundation. If you find yourself
turning the release switch on so that a story will appear, stop and go and
find the signed form first.

### Then the rest

1. **Success stories** → **+**
2. Their name — a first name on its own is usually the kinder choice.
3. Headline, short version, the full story.
4. **A quote from them** — only words they actually said. Never write a
   quote on someone's behalf, even a flattering one.
5. Photo — only if the media release covers photographs. If you are not
   certain, leave it out. The story reads perfectly well without one.
6. Turn **Show this on the website** ON → **Save**.

---

## 7. Impact numbers and the donation goal

### The numbers on the Impact page

**Impact numbers** in the side list.

Each one has three separate boxes, and this trips everyone up at first:

| Box | For "$7,000+" you put |
|---|---|
| Symbol before the number | `$` |
| The number itself | `7000` — digits only, no commas, no dollar sign |
| Symbol after the number | `+` |

The number box must contain **only digits** or the counting animation will
not work.

**If you are not sure a number is right, delete it from the number box and
save.** The website then shows nothing at all for that figure, which is far
better than showing a guess. A wrong number on a charity website is the one
mistake that costs you a grant.

Two more boxes go with every number:

- **Where this number came from** — e.g. *"Counted from our 2026
  scholarship files"*
- **Date you last checked it**

If you cannot fill in where it came from, the number is not ready to
publish yet.

### The donation goal bar

Same place — **Impact numbers** — in the entry called **campaign-goal**.

- **The number itself** = how much has been raised so far
- **Goal** = what you are aiming for

**The bar needs both.** If either is empty the whole bar is hidden, which is
intentional: half a goal bar tells a donor nothing and invites them to
assume the worst.

---

## 8. How to add a sponsor logo

1. **Sponsors** → **+**
2. **Business name** — exactly how they spell it, punctuation and all.
3. **Their logo** — see the sizes below.
4. **Their website** — must start with `https://`
5. Turn **Show this sponsor** ON → **Save**.

### What to ask the sponsor for

> "Could you send us your logo as a **PNG or SVG with a transparent
> background**, around **400 pixels wide**? We'll put it on our website's
> sponsor page."

Those are the words to copy into an email. If they send something else:

| What they send | What to do |
|---|---|
| A PNG or SVG | Perfect. Upload it. |
| A big photo or JPEG | Upload it anyway — it gets resized automatically |
| A photo of a business card | **Don't.** Leave the logo box empty — their name shows as text, which looks far better than a blurry card |
| Nothing yet | Leave the logo empty and fill in the name |

Every logo sits in a box of the same size, so a wide logo and a square one
will both look right. You do not need to crop or resize anything.

**Only add a sponsor once the partnership is actually agreed.** Putting a
company's logo on our website is a public statement about their business.

---

## 9. Changing wording and photos

### Any wording on any page

**Page wording** in the side list. Then pick the page: Home page, About
page, Ty's Story page, and so on.

Inside, every heading and paragraph on that page is its own box, labelled
in plain terms — *Hero — main heading*, *Mission — paragraph*. Under each
one it tells you what it currently says, so you can find the right box
without guessing.

Change the words, press **Save**, and it is live in about a minute.

**If you empty a box, the page keeps what it says now.** Clearing a box
does not blank the page.

### Any photo

Photos live with the thing they belong to. To change the photo on an event,
open that event. To change a sponsor's logo, open that sponsor.

Everywhere you can add a photo:

- Upload straight from your phone. **Big photos are shrunk automatically** —
  you never need to resize anything first.
- **Every photo needs "Describe this photo" filled in** or it will not
  appear. One short sentence saying what is in it.

### Photos of children

Only photographs of real young people in our programs, and only where we
have a signed media release. Never a stock photo. If there is no photo
available, leave it empty — every part of this website is built to look
right without one.

---

## 10. Hiding something

**Every single thing on this website has a switch called "Show this on the
website".** Turn it OFF and save. It disappears from the live site
immediately and keeps everything you typed.

Use this for:

- an event that got cancelled
- a sponsor whose sponsorship ended
- a story someone asked you to take down
- anything you are part-way through writing

**Turning it off is always the right first move.** It is instant, it is
reversible, and nothing is lost. Deleting is permanent — only delete when
you are certain you will never want it back.

**If someone asks you to take their story or photo down, turn it off
straight away and work out the details afterwards.** You do not need to ask
anybody's permission to do that.

---

## 11. If something looks broken

Work down this list. Most things stop at step 1 or 2.

**1. Wait two minutes and refresh.**
Saving takes about a minute to reach the live site. Refresh the page: on a
phone, pull down from the top.

**2. Check the switch.**
Nine times in ten, "it didn't appear" means **Show this on the website** is
still off. Open the entry and look at the top.

**3. A photo is missing.**
Open the entry and check **Describe this photo** has something in it. An
empty description means the photo is hidden on purpose.

**4. A story about a child is missing.**
Check the consent switches in section 6. Both must be on. This is the
website protecting that child, working exactly as intended.

**5. A number is not showing.**
The number box probably has a comma, a dollar sign, or a `+` in it. Digits
only — the symbols go in the separate boxes.

**6. The editor shows a blank page.**
Close the tab completely and open `tysfuturestars.org/admin` again. The
website itself is unaffected, and nothing you saved before is lost.

**7. It says you do not have access.**
Check your email for the GitHub invitation and click Accept.

### If none of that works

**The website is almost certainly fine.** Problems with the editor do not
take the website down — they are separate things.

Text Grey with:
- what you were trying to change
- what you expected to happen
- what happened instead
- a screenshot if you can

Then stop. **Do not keep pressing Save to see if it fixes itself** — that
makes it harder to work out what went wrong.

---

## 12. What not to touch

You genuinely cannot break the site through the editor. These are the few
places where a change has consequences you would not expect.

### Do not change a "Short name for this entry" or "Web address name"

Once something has been published, that name is part of the link people
have shared, bookmarked, or put in a newsletter. Changing it breaks every
one of those links. Set it once; after that, leave it.

### Do not edit the Privacy Policy or Terms of Use

They are not in the editor, on purpose. They are legal text, and changing a
word can change what the foundation has committed to. Email Grey.

### Do not invent a number

Not an estimate, not a round-up, not "about". Every figure on this site is
one we can evidence. If you do not have the real number, leave it empty —
the website is built to look right without it.

### Do not write a quote for someone

Testimonials and story quotes must be words the person actually said, with
their permission to publish them. A made-up quote attributed to a parent is
the single worst thing that could go on this site.

### Do not publish a sponsor logo before the partnership is agreed

It is a public claim about someone else's business.

### Do not put a home address anywhere

Not in an event address, not in the mailing address. A PO box is fine. A
public page with a home address on it is a safety problem.

### Do not use a phone number you have not dialled

Especially on the Resources page. Someone in trouble will call it.

---

## A one-minute summary

| You want to | Go to |
|---|---|
| Add an event | **Events** → + |
| Write news | **Updates** → + |
| Share a young person's story | **Success stories** → + (read section 6 first) |
| Change a number | **Impact numbers** |
| Add a sponsor | **Sponsors** → + |
| Change words on a page | **Page wording** → pick the page |
| Change a photo | Open the thing the photo belongs to |
| Hide anything | Open it → **Show this on the website** OFF → Save |

**Every entry has a Show-this switch. Every photo needs a description.
Every number needs to be real. Saving publishes.**

That is the whole system.
