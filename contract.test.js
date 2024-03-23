export default async function(ctx) {
	ctx.transfer({
		from: ctx.initiator,
		to: ctx.owner,
		coin: "BTC",
		amount: 10
	})

	return true
}