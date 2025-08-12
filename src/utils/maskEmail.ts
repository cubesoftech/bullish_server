export default function maskEmail(email: string) {
    const [name, domain] = email.split("@");
    if (name.length <= 3) {
        return name[0] + "***@" + domain
    } else {
        return name.substring(0, 3) + "***@" + domain
    }
}