export default async function(ctx) {
	ctx.transfer({
		from: "0x000",
		to: ctx.initiator,
		coin: "JSC",
		amount: 50
	})

	return true
}