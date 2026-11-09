# ZOVRO transport route and one-price booking

Transportation services include Moving, Furniture Moving, Furniture Delivery, Appliance Delivery, Pickup-Truck Help, Hauling, Junk Removal, Local Courier, Towing and Emergency Towing. All other service forms are unchanged.

## Customer experience
1. Choose a transportation service.
2. Enter the pickup/start address and drop-off/destination address; the customer's current GPS location is **not** silently used as the pickup location.
3. For moving and hauling, select 1–8 loading/unloading workers and 1–16 estimated hours. Towing/courier do not add movers.
4. Choose **Calculate miles & total**. If the routing provider is available, show one estimated USD amount incorporating vehicle/base, road miles and loading/unloading labor.
5. Send the request. This **does not charge** or lock a price. The matched professional reviews the route and moves the job into the existing one-quote payment workflow. The customer approves **one all-inclusive provider price and makes one payment**, not a separate labor checkout.

No new payment processor or split transaction was added. Existing Stripe quote, approval, payment and release rules continue to govern.

## Routing API
- Enable Google Maps Routes API in the Google Cloud project associated with the backend, with its applicable billing and usage limits.
- Configure the server-only environment variable `ZOVRO_GOOGLE_ROUTES_API_KEY` using a key restricted to Routes API. **Never place it in the app, repository, or client-side bundle.**
- The backend calls Google Routes Compute Routes to obtain **road-driving distance in miles**, not straight-line miles. The request uses only the pickup and destination entered by the customer.
- If the key is not present, the route cannot be calculated, addresses are invalid, or routing is unreachable, the UI explicitly reports that mileage and the estimated amount are unavailable. The customer can still request a professional's **single inclusive quote**. No invented mileage is shown.
- Estimate responses are signed server-side, valid for 15 minutes and bound to the exact service, addresses, crew size and hours. Changing any quote input invalidates the displayed estimate. The backend does not accept customer-supplied prices.

## Indicative rates (not fixed provider offers)
Default planning rate schedule, **not a promise of the customer's price**:
| Service group | Vehicle/base | Per drivable mile | Per worker per hour |
|---|---:|---:|---:|
| Moving / furniture delivery | $65 | $2.75 | $35 |
| Hauling / junk removal | $85 | $3.00 | $35 |
| Towing | $95 | $3.25 | not applicable |
| Courier | $20 | $1.80 | not applicable |

Each rate may be changed in Render using `ZOVRO_TRANSPORT_<GROUP>_BASE_CENTS`, `ZOVRO_TRANSPORT_<GROUP>_MILE_CENTS`, and `ZOVRO_TRANSPORT_<GROUP>_WORKER_HOUR_CENTS`, where GROUP is `MOVING`, `HAULING`, `TOWING` or `COURIER`. These are estimates and must be reviewed against actual provider rates; they do **not** automatically set the provider's payable quote.

Before public launch: secure the Maps billing limits, verify driving distances with real Michigan addresses, confirm provider charges/cancellation terms, then run an end-to-end signed-device quote → customer price approval → one Stripe checkout test.
